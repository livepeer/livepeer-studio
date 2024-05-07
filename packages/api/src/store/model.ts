/**
 * DEPRECATED. Use `db` for stuff instead of  `req.store`.
 */

import schema from "../schema/schema.json";
import { NotFoundError } from "./errors";
import { kebabToCamel } from "../util";
import { DB } from "./db";
import { IStore } from "../types/common";
import { TableSchema } from "./types";

export default class Model implements IStore {
  public ready: Promise<void>;

  constructor(private db: DB) {
    this.ready = db.ready;
  }

  getTable(id) {
    let [table, uuid] = id.split("/");
    table = kebabToCamel(table);
    if (!this.db[table]) {
      throw new Error(`table not found: ${table}`);
    }
    return [table, uuid];
  }

  async get(id, cleanWriteOnly = true) {
    const [table, uuid] = this.getTable(id);
    if (!this.db[table]) {
      throw new Error(`table not found for ${id}`);
    }
    const responses = await this.db[table].get(uuid);
    if (responses && cleanWriteOnly) {
      return this.cleanWriteOnlyResponses(id, responses);
    }
    return responses;
  }

  async replace(data) {
    // NOTE: method does not replace objects saved from fields with an index
    if (typeof data !== "object" || typeof data.id !== "string") {
      throw new Error(`invalid values: ${JSON.stringify(data)}`);
    }
    const { id, kind } = data;
    if (!id || !kind) {
      throw new Error("missing id, kind");
    }

    const key = `${kind}/${id}`;
    const record = await this.get(key);

    if (!record) {
      throw new NotFoundError(`key not found: ${JSON.stringify(key)}`);
    }

    const [table] = this.getTable(kind);
    return await this.db[table].replace(data);
  }

  async list({ prefix, cursor, limit, filter, cleanWriteOnly = true }) {
    if (filter) {
      throw new Error("filter no longer supported, use `db.find` instead");
    }
    const [kind] = prefix.split("/");
    const [table] = this.getTable(prefix);
    let [docs, nextCursor] = await this.db[table].find({}, { limit, cursor });
    if (docs.length > 0 && cleanWriteOnly) {
      docs = docs.map((doc) => this.cleanWriteOnlyResponses(kind, doc));
    }
    return {
      data: docs,
      cursor: nextCursor,
    };
  }

  async listKeys(prefix, cursor, limit): Promise<[string[], string]> {
    const [table] = this.getTable(prefix);
    const [response, nextCursor] = await this.db[table].find(
      {},
      { limit, cursor }
    );
    const keys = response.map((x) => x.id);
    return [keys, nextCursor];
  }

  async query({ kind, query, cursor, limit }) {
    const [_, ...others] = Object.keys(query);
    if (others.length > 0) {
      throw new Error("you may only query() by one key");
    }
    const [table] = this.getTable(kind);
    const [docs, cursorOut] = await this.db[table].find(query, {
      cursor,
      limit,
    });
    const keys = docs.map((x) => x.id);

    return { data: keys, cursor: cursorOut };
  }

  async queryObjects({
    kind,
    query,
    cursor,
    limit,
    filter,
    cleanWriteOnly = true,
  }) {
    if (filter) {
      throw new Error("filter no longer supported, use db[table].find");
    }
    const [queryKey, ...others] = Object.keys(query);
    if (others.length > 0) {
      throw new Error("you may only query() by one key");
    }
    const [table] = this.getTable(kind);

    let [docs, cursorOut] = await this.db[table].find(query, { cursor, limit });
    if (cleanWriteOnly) {
      docs = docs.map((doc) => this.cleanWriteOnlyResponses(kind, doc));
    }
    return { data: docs, cursor: cursorOut };
  }

  async deleteKey(key) {
    return this.delete(key);
  }

  async delete(key) {
    const [table, id] = this.getTable(key);
    const record = await this.db[table].get(id);
    if (!record) {
      throw new NotFoundError(`key not found: ${JSON.stringify(key)}`);
    }
    return await this.db[table].delete(id);
  }

  async create(doc) {
    if (typeof doc !== "object" || typeof doc.id !== "string") {
      throw new Error(`invalid values: ${JSON.stringify(doc)}`);
    }
    const { id, kind } = doc;
    if (!id || !kind || typeof doc.kind !== "string") {
      throw new Error(`Missing required values: id, kind`);
    }

    const [table] = this.getTable(kind);
    return await this.db[table].create(doc);
  }

  getSchema(kind: string) {
    const cleanKind = this.getCleanKind(kind);
    const schemas: TableSchema = schema.components.schemas[cleanKind];
    if (!schemas) {
      return [null, null] as const;
    }
    return [schemas.properties, cleanKind] as const;
  }

  getCleanKind(kind: string): string {
    let cleanKind = kind.charAt(0) === "/" ? kind.substring(1) : kind;
    return cleanKind.indexOf("/") > -1
      ? cleanKind.substr(0, cleanKind.indexOf("/"))
      : cleanKind;
  }

  cleanWriteOnlyResponses(id, responses) {
    // obfuscate writeOnly fields in objects returned
    const [properties] = this.getSchema(id);
    const writeOnlyFields = {};
    if (properties) {
      for (const [fieldName, fieldArray] of Object.entries(properties)) {
        if (fieldArray.writeOnly) {
          writeOnlyFields[fieldName] = null;
        }
      }
    }

    if ("data" in responses) {
      responses.data = responses.data.map((x) => ({
        ...x,
        ...writeOnlyFields,
      }));
    } else {
      responses = {
        ...responses,
        ...writeOnlyFields,
      };
    }

    return responses;
  }
}
