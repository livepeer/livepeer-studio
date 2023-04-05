import { Pool, QueryConfig, QueryResult } from "pg";
import { parse as parseUrl, format as stringifyUrl } from "url";
import { hostname } from "os";
import { Histogram } from "prom-client";

import logger from "../logger";
import schema from "../schema/schema.json";
import {
  ObjectStore,
  ApiToken,
  User,
  PasswordResetToken,
  Usage,
  Region,
  WebhookResponse,
  Session,
  CdnUsageLast,
  SigningKey,
} from "../schema/types";
import BaseTable, { TableOptions } from "./table";
import StreamTable, {
  DeprecatedStreamFields,
  StreamStats,
} from "./stream-table";
import { kebabToCamel } from "../util";
import { QueryOptions, WithID } from "./types";
import MultistreamTargetTable from "./multistream-table";
import WebhookTable from "./webhook-table";
import { CdnUsageTable } from "./cdn-usage-table";
import AssetTable from "./asset-table";
import TaskTable from "./task-table";
import ExperimentTable from "./experiment-table";

// Should be configurable, perhaps?
const CONNECT_TIMEOUT = 5000;

export interface PostgresParams {
  postgresUrl: string;
  postgresReplicaUrl?: string;
  appName?: string;
}

export type DBSession = WithID<Session> & StreamStats & DeprecatedStreamFields;

type Table<T> = BaseTable<WithID<T>>;

type QueryHistogramLabels = {
  query: string;
  result: string;
};

const metricHistogram: Histogram<keyof QueryHistogramLabels> = new Histogram({
  name: "livepeer_api_pgsql_query_duration_seconds",
  help: "duration histogram of pgsql queries",
  buckets: [0.003, 0.03, 0.1, 0.3, 1.5, 10],
  labelNames: ["query", "result"] as const,
});

const makeTable = <T>(opts: TableOptions) =>
  new BaseTable<WithID<T>>(opts) as Table<T>;

export class DB {
  // Table objects
  stream: StreamTable;
  objectStore: Table<ObjectStore>;
  multistreamTarget: MultistreamTargetTable;
  asset: AssetTable;
  task: TaskTable;
  signingKey: Table<SigningKey>;
  apiToken: Table<ApiToken>;
  user: Table<User>;
  experiment: ExperimentTable;
  usage: Table<Usage>;
  webhook: WebhookTable;
  webhookResponse: Table<WebhookResponse>;
  passwordResetToken: Table<PasswordResetToken>;
  region: Table<Region>;
  session: Table<DBSession>;
  cdnUsageLast: Table<CdnUsageLast>;
  cdnUsageTable: CdnUsageTable;

  postgresUrl: string;
  replicaUrl: string;
  ready: Promise<void>;
  pool: Pool;
  replicaPool: Pool;

  constructor() {
    // This is empty now so we can have a `db` singleton. All the former
    // constructor logic has moved to start({}).
  }

  async start({
    postgresUrl,
    postgresReplicaUrl,
    appName = "api",
  }: PostgresParams) {
    this.postgresUrl = postgresUrl;
    if (!postgresUrl) {
      throw new Error("no postgres url provided");
    }
    try {
      await ensureDatabase(postgresUrl);
    } catch (e) {
      console.error(`error in ensureDatabase: ${e.message}`);
      throw e;
    }
    this.pool = new Pool({
      connectionTimeoutMillis: CONNECT_TIMEOUT,
      connectionString: postgresUrl,
      application_name: `${appName}-${hostname()}`,
    });

    if (postgresReplicaUrl) {
      console.log("replica url found, using read replica");
      this.replicaPool = new Pool({
        connectionTimeoutMillis: CONNECT_TIMEOUT,
        connectionString: postgresReplicaUrl,
        application_name: `${appName}-read-${hostname()}`,
      });
    } else {
      console.log("no replica url found, not using read replica");
    }

    await this.query("SELECT NOW()");
    await this.replicaQuery("SELECT NOW()");
    await this.makeTables();
  }

  async close() {
    if (!this.pool) {
      return;
    }
    await this.pool.end();
  }

  async makeTables() {
    const schemas = schema.components.schemas;
    this.stream = new StreamTable({ db: this, schema: schemas["stream"] });
    this.objectStore = makeTable<ObjectStore>({
      db: this,
      schema: schemas["object-store"],
    });
    this.multistreamTarget = new MultistreamTargetTable({
      db: this,
      schema: schemas["multistream-target"],
    });
    this.apiToken = makeTable<ApiToken>({
      db: this,
      schema: schemas["api-token"],
    });
    this.asset = new AssetTable({
      db: this,
      schema: schemas["asset"],
    });
    this.task = new TaskTable({
      db: this,
      schema: schemas["task"],
    });
    this.signingKey = makeTable<SigningKey>({
      db: this,
      schema: schemas["signing-key"],
    });
    this.user = makeTable<User>({ db: this, schema: schemas["user"] });
    this.experiment = new ExperimentTable({
      db: this,
      schema: schemas["experiment"],
    });
    this.usage = makeTable<Usage>({ db: this, schema: schemas["usage"] });
    this.webhook = new WebhookTable({ db: this, schema: schemas["webhook"] });
    this.passwordResetToken = makeTable<PasswordResetToken>({
      db: this,
      schema: schemas["password-reset-token"],
    });

    this.region = makeTable<Region>({ db: this, schema: schemas["region"] });
    this.webhookResponse = makeTable<WebhookResponse>({
      db: this,
      schema: schemas["webhook-response"],
    });
    this.session = makeTable<Session>({ db: this, schema: schemas["session"] });
    this.cdnUsageLast = makeTable<CdnUsageLast>({
      db: this,
      schema: schemas["cdn-usage-last"],
    });

    const tables = Object.entries(schema.components.schemas).filter(
      ([name, schema]) => "table" in schema && schema.table
    );
    await Promise.all(
      tables.map(([name, schema]) => {
        const camelName = kebabToCamel(name);
        return this[camelName].ensureTable();
      })
    );

    this.cdnUsageTable = new CdnUsageTable(this);
    await this.cdnUsageTable.makeTable();
  }

  queryWithOpts<T, I extends any[] = any[]>(
    query: QueryConfig<I>,
    opts: QueryOptions = { useReplica: true }
  ): Promise<QueryResult<T>> {
    const { useReplica = true } = opts;
    if (useReplica && this.replicaPool) {
      return this.replicaPool.query(query);
    }
    return this.pool.query(query);
  }

  query<T, I extends any[] = any[]>(
    query: string | QueryConfig<I>,
    values?: I
  ): Promise<QueryResult<T>> {
    return this.runQuery(this.pool, query, values);
  }

  replicaQuery<T, I extends any[] = any[]>(
    query: string | QueryConfig<I>,
    values?: I
  ): Promise<QueryResult<T>> {
    let pool = this.replicaPool ?? this.pool;
    return this.runQuery(pool, query, values);
  }

  async runQueryNoMetrics<T, I extends any[] = any[]>(
    pool: Pool,
    query: string | QueryConfig<I>,
    values?: I
  ): Promise<QueryResult<T>> {
    let queryLog: string;
    if (typeof query === "string") {
      queryLog = JSON.stringify({ query: query.trim(), values });
    } else {
      queryLog = JSON.stringify(query);
    }
    let result: QueryResult;
    logger.info(`runQuery phase=start query=${queryLog}`);
    const start = Date.now();
    try {
      result = await pool.query(query, values);
    } catch (e) {
      logger.error(
        `runQuery phase=error elapsed=${Date.now() - start}ms error=${
          e.message
        } query=${queryLog}`
      );
      throw e;
    }
    logger.info(
      `runQuery phase=success elapsed=${Date.now() - start}ms rows=${
        result?.rowCount
      } query=${queryLog}`
    );
    return result;
  }

  // Internal logging function — use query() or replicaQuery() externally
  async runQuery<T, I extends any[] = any[]>(
    pool: Pool,
    query: string | QueryConfig<I>,
    values?: I
  ): Promise<QueryResult<T>> {
    let labels: QueryHistogramLabels = {
      query: typeof query === "string" ? query.trim() : query.text,
      result: "success",
    };
    const queryTimer = metricHistogram.startTimer();
    try {
      return await this.runQueryNoMetrics(pool, query, values);
    } catch (e) {
      labels.result = "error";
      throw e;
    } finally {
      queryTimer(labels);
    }
  }
}

// Auto-create database if it doesn't exist
async function ensureDatabase(postgresUrl: string) {
  const pool = new Pool({
    connectionString: postgresUrl,
    connectionTimeoutMillis: CONNECT_TIMEOUT,
  });
  try {
    await pool.query("SELECT NOW()");
    // If we made it down here, the database exists. Cool.
    pool.end();
    return;
  } catch (e) {
    // We only know how to handle one error...
    if (!e.message.includes("does not exist")) {
      throw e;
    }
  }
  const parsed = parseUrl(postgresUrl);
  const dbName = parsed.pathname.slice(1);
  parsed.pathname = "/postgres";
  const adminUrl = stringifyUrl(parsed);
  const adminPool = new Pool({
    connectionTimeoutMillis: CONNECT_TIMEOUT,
    connectionString: adminUrl,
  });
  await adminPool.query("SELECT NOW()");
  await adminPool.query(`CREATE DATABASE ${dbName}`);
  logger.info(`Created database ${dbName}`);
  pool.end();
  adminPool.end();
}

export default new DB();
