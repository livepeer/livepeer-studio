import sql from "sql-template-strings";
import Table from "./table";
import { Stream } from "../schema/types";
import { QueryResult, QueryResultRow } from "pg";
import { DBLegacyObject, QueryOptions, WithID } from "./types";

interface UsageData {
  id?: string;
  date?: number;
  sourceSegments: number;
  transcodedSegments: number;
  sourceSegmentsDuration: number;
  transcodedSegmentsDuration: number;
  streamCount: number;
}

interface DBUsageData extends QueryResultRow {
  sourcesegments: string;
  transcodedsegments: string;
  sourcesegmentsduration: number;
  transcodedsegmentsduration: number;
  streamCount: number;
}

interface DBUsageHistoryData extends QueryResultRow {
  id: string;
  date: number;
  sourcesegments: string;
  transcodedsegments: string;
  sourcesegmentsduration: number;
  transcodedsegmentsduration: number;
  streamCount: number;
}

export interface StreamStats {
  sourceBytes?: number;
  transcodedBytes?: number;
  sourceSegments?: number;
  transcodedSegments?: number;
  sourceSegmentsDuration?: number;
  transcodedSegmentsDuration?: number;
}

export interface DBStreamFields extends StreamStats {
  previousStats?: StreamStats;
  lastSessionId?: string;
  userSessionCreatedAt?: number;
}

export type DBStream = WithID<Stream> & DBStreamFields;

export default class StreamTable extends Table<DBStream> {
  async cachedUsageHistory(
    fromTime: number,
    toTime: number,
    opts?: QueryOptions
  ): Promise<UsageData[]> {
    let usage = [];
    const q1 = sql`SELECT
      id,
      (data->>'date')::real as date,
      (data->>'sourceSegmentsDuration')::real as sourceSegmentsDuration,
      (data->>'transcodedSegmentsDuration')::real as transcodedSegmentsDuration,
      (data->>'sourceSegments')::real as sourceSegments,
      (data->>'transcodedSegments')::real as transcodedSegments,
      (data->>'streamCount')::real as streamCount

    FROM usage WHERE data->>'date' >= ${fromTime}
      AND data->>'date' < ${toTime}
      ORDER BY date
    `;

    let res: QueryResult<DBUsageData>;
    res = await this.db.queryWithOpts(q1, opts);

    if (res.rowCount > 0) {
      for (const row of res.rows) {
        usage.push({
          id: row.id,
          date: row.date,
          sourceSegments: row.sourcesegments,
          transcodedSegments: row.transcodedsegments,
          sourceSegmentsDuration: row.sourcesegmentsduration,
          transcodedSegmentsDuration: row.transcodedsegmentsduration,
          streamCount: row.streamcount,
        });
      }
    }
    return usage;
  }

  async usageHistory(fromTime: number, toTime: number, opts?: QueryOptions) {
    const q1 = sql`SELECT
      TO_TIMESTAMP((data->>'createdAt')::bigint/1000)::date as day,
      sum((data->>'sourceSegmentsDuration')::float) as sourceSegmentsDuration,
      sum((data->>'transcodedSegmentsDuration')::float) as transcodedSegmentsDuration,
      sum((data->>'transcodedSegments')::int) as transcodedSegments,
      sum((data->>'sourceSegments')::numeric) as sourceSegments,
      count(*)::int as streamCount

    FROM stream WHERE data->>'sourceSegmentsDuration' IS NOT NULL
      AND data->>'parentId' IS NOT NULL
      AND (data->>'createdAt')::bigint >= ${fromTime}
      AND (data->>'createdAt')::bigint < ${toTime}
      GROUP BY day
      ORDER BY day
    `;

    let usage = [];

    let res: QueryResult<DBUsageHistoryData>;
    res = await this.db.queryWithOpts(q1, opts);

    let knownDays = {};

    if (res.rowCount > 0) {
      for (const row of res.rows) {
        let dayStartTimestamp = new Date(row.day).setUTCHours(0, 0, 0, 0);
        usage.push({
          id: new Date(row.day).toISOString().split("T")[0],
          date: dayStartTimestamp,
          sourceSegments: +row.sourcesegments,
          transcodedSegments: +row.transcodedsegments,
          sourceSegmentsDuration: row.sourcesegmentsduration,
          transcodedSegmentsDuration: row.transcodedsegmentsduration,
          streamCount: row.streamcount,
        });
        knownDays[row.day] = usage.length - 1;
      }
    }
    const q2 = sql`SELECT
      TO_TIMESTAMP((data->>'createdAt')::bigint/1000)::date as day,
      sum((data->>'sourceSegmentsDuration')::float) as sourceSegmentsDuration,
      sum((data->>'transcodedSegmentsDuration')::float) as transcodedSegmentsDuration,
      sum((data->>'transcodedSegments')::int) as transcodedSegments,
      sum((data->>'sourceSegments')::numeric) as sourceSegments,
      count(*)::int as streamCount

    FROM stream s WHERE data->>'sourceSegmentsDuration' IS NOT NULL
      AND data->>'parentId' IS NULL
      AND (SELECT COUNT(C.id) FROM stream C WHERE C.data->>'parentId' = S.Id) = 0
      AND (data->>'createdAt')::bigint >= ${fromTime}
      AND (data->>'createdAt')::bigint < ${toTime}
      GROUP BY day
      ORDER BY day
    `;

    res = await this.db.queryWithOpts(q2, opts);
    if (res.rowCount > 0) {
      for (const row of res.rows) {
        if (knownDays[row.day] !== undefined) {
          let index = knownDays[row.day];
          usage[index].sourceSegments += +row.sourcesegments;
          usage[index].transcodedSegments += +row.transcodedsegments;
          usage[index].sourceSegmentsDuration += row.sourcesegmentsduration;
          usage[index].transcodedSegmentsDuration +=
            row.transcodedsegmentsduration;
          usage[index].streamCount += row.streamcount;
        } else {
          let dayStartTimestamp = new Date(row.day).setUTCHours(0, 0, 0, 0);
          usage.push({
            id: new Date(row.day).toISOString().split("T")[0],
            date: dayStartTimestamp,
            sourceSegments: +row.sourcesegments,
            transcodedSegments: +row.transcodedsegments,
            sourceSegmentsDuration: row.sourcesegmentsduration,
            transcodedSegmentsDuration: row.transcodedsegmentsduration,
            streamCount: row.streamcount,
          });
        }
      }
    }
    return usage;
  }

  async usage(
    userId: string,
    fromTime: number | string,
    toTime: number | string,
    opts?: QueryOptions
  ): Promise<UsageData> {
    const q1 = sql`SELECT
      sum((data->>'sourceSegmentsDuration')::float) as sourceSegmentsDuration,
      sum((data->>'transcodedSegmentsDuration')::float) as transcodedSegmentsDuration,
      sum((data->>'sourceSegments')::numeric) as sourceSegments,
      sum((data->>'transcodedSegments')::int) as transcodedSegments,
      count(*)::int as streamCount

    FROM stream WHERE data->>'userId' = ${userId}
      AND data->>'sourceSegmentsDuration' IS NOT NULL
      AND data->>'parentId' IS NOT NULL
      AND data->>'createdAt' >= ${fromTime}
      AND data->>'createdAt' < ${toTime}
    `;

    const usage = {
      sourceSegments: 0,
      transcodedSegments: 0,
      sourceSegmentsDuration: 0,
      transcodedSegmentsDuration: 0,
      streamCount: 0,
    };

    let res: QueryResult<DBUsageData>;
    res = await this.db.queryWithOpts(q1, opts);
    if (res.rowCount > 0) {
      const dbUsage = res.rows[0];
      usage.sourceSegments += parseInt(dbUsage.sourcesegments);
      usage.transcodedSegments += parseInt(dbUsage.transcodedsegments);
      usage.sourceSegmentsDuration += dbUsage.sourcesegmentsduration;
      usage.transcodedSegmentsDuration += dbUsage.transcodedsegmentsduration;
      usage.streamCount += dbUsage.streamcount;
    }
    const q2 = sql`SELECT
      sum((data->>'sourceSegmentsDuration')::float) as sourceSegmentsDuration,
      sum((data->>'transcodedSegmentsDuration')::float) as transcodedSegmentsDuration,
      sum((data->>'sourceSegments')::numeric) as sourceSegments,
      sum((data->>'transcodedSegments')::int) as transcodedSegments,
      count(*)::int as streamCount

    FROM stream S WHERE data->>'userId' = ${userId}
      AND data->>'sourceSegmentsDuration' IS NOT NULL
      AND data->>'parentId' IS NULL
      AND (SELECT COUNT(C.id) FROM stream C WHERE C.data->>'parentId' = S.Id) = 0
      AND data->>'createdAt' >= ${fromTime}
      AND data->>'createdAt' < ${toTime}
    `;
    res = await this.db.queryWithOpts(q2, opts);
    if (res.rowCount > 0) {
      const dbUsage = res.rows[0];
      usage.sourceSegments += parseInt(dbUsage.sourcesegments);
      usage.transcodedSegments += parseInt(dbUsage.transcodedsegments);
      usage.sourceSegmentsDuration += dbUsage.sourcesegmentsduration;
      usage.transcodedSegmentsDuration += dbUsage.transcodedsegmentsduration;
      usage.streamCount += dbUsage.streamcount;
    }
    return usage;
  }

  async getByIdOrPlaybackId(id: string, opts?: QueryOptions) {
    const [s1, s2] = await Promise.all([
      this.get(id, opts),
      this.getByPlaybackId(id, opts),
    ]);
    return s1 || s2;
  }

  async getByStreamKey(
    streamKey: string,
    opts?: QueryOptions
  ): Promise<DBStream> {
    const res: QueryResult<DBLegacyObject> = await this.db.queryWithOpts(
      sql`SELECT data FROM stream  WHERE data->>'streamKey'=${streamKey}`.setName(
        `${this.name}_by_streamKey`
      ),
      opts
    );
    return res.rowCount < 1 ? null : (res.rows[0].data as DBStream);
  }

  async getByPlaybackId(
    playbackId: string,
    opts?: QueryOptions
  ): Promise<DBStream> {
    const res: QueryResult<DBLegacyObject> = await this.db.queryWithOpts(
      sql`SELECT data FROM stream  WHERE data->>'playbackId'=${playbackId}`.setName(
        `${this.name}_by_playbackid`
      ),
      opts
    );
    return res.rowCount < 1 ? null : (res.rows[0].data as DBStream);
  }

  async getLastSession(id: string, opts?: QueryOptions): Promise<DBStream> {
    const res: QueryResult<DBLegacyObject> = await this.db.queryWithOpts(
      sql`SELECT data FROM stream  WHERE data->>'parentId'=${id} ORDER BY data->'createdAt' DESC LIMIT 1`.setName(
        `${this.name}_by_parentid_last_session`
      ),
      opts
    );
    return res.rowCount < 1 ? null : (res.rows[0].data as DBStream);
  }

  async setActiveToFalse(stream: {
    id: string;
    lastSeen?: number;
    name?: string;
  }): Promise<{ rowCount: number }> {
    let upRes;
    try {
      upRes = await this.update(
        [
          sql`id = ${stream.id}`,
          sql`(data->>'lastSeen')::bigint = ${stream.lastSeen}`,
        ],
        { isActive: false },
        { throwIfEmpty: false }
      );
      if (upRes.rowCount) {
        console.log(
          `cleaned timed out stream id=${stream.id} lastSeen=${new Date(
            stream.lastSeen
          )} name=${stream.name}`
        );
      }
    } catch (e) {
      console.error(
        `error setting stream active to false id=${stream.id} name=${stream.name} err=${e}`
      );
      upRes = { rowCount: 0 };
    }
    return upRes;
  }

  async markIsActiveFalseMany(ids: Array<string>) {
    const res = await this.db.query(
      `UPDATE ${
        this.name
      } SET data = jsonb_set(data, '{isActive}', 'false'::jsonb) WHERE id IN (${ids
        .map((_, i) => "$" + (i + 1))
        .join(",")})`,
      ids
    );
    return res;
  }

  addDefaultFieldsMany(objs: Array<DBStream>): Array<DBStream> {
    return objs.map(this.addDefaultFields);
  }

  addDefaultFields(obj: DBStream): DBStream {
    return {
      lastSeen: 0,
      isActive: false,
      record: false,
      suspended: false,
      sourceSegments: 0,
      transcodedSegments: 0,
      sourceSegmentsDuration: 0,
      transcodedSegmentsDuration: 0,
      sourceBytes: 0,
      transcodedBytes: 0,
      ...obj,
    };
  }

  removePrivateFields(obj: DBStream, isAdmin: boolean = false): DBStream {
    // Maybe create a copy to avoid input mutation
    for (const fn of privateFields) {
      delete obj[fn];
    }
    if (!isAdmin) {
      for (const fn of adminOnlyFields) {
        delete obj[fn];
      }
    }
    return obj;
  }

  removePrivateFieldsMany(
    objs: Array<DBStream>,
    isAdmin: boolean = false
  ): Array<DBStream> {
    return objs.map((o) => this.removePrivateFields(o, isAdmin));
  }
}

const adminOnlyFields = ["mistHost", "broadcasterHost"];

const privateFields = [
  "recordObjectStoreId",
  "previousSessions",
  "partialSession",
  "previousStats",
  "lastSessionId",
  "userSessionCreatedAt",
];
