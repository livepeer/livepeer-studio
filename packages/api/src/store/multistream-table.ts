import { URL } from "url";
import * as uuid from "uuid";

import { MultistreamTarget } from "../schema/types";
import Table from "./table";
import { GetOptions, WithID } from "./types";
import { InternalServerError, UnprocessableEntityError } from "./errors";

export type DBMultistreamTarget = WithID<MultistreamTarget>;

export interface MultistreamTargetInput {
  name?: string;
  url: string;
  disabled?: boolean;
  userId: string;
}

const parseUrl = (url: string) => {
  try {
    return new URL(url);
  } catch (err) {
    throw new UnprocessableEntityError(`Bad URL ${url}: ${err}`);
  }
};

export default class MultistreamTargetTable extends Table<DBMultistreamTarget> {
  async fillAndCreate(input: MultistreamTargetInput) {
    const url = parseUrl(input.url);
    const target: Required<MultistreamTarget> = {
      id: uuid.v4(),
      name: input.name || url.host,
      url: input.url,
      disabled: input.disabled ?? false,
      userId: input.userId,
      createdAt: Date.now(),
    };
    await super.create(target);

    const created = await this.get(target.id, { useReplica: false });
    if (!created) {
      throw new InternalServerError("error creating new multistream target");
    }
    return created;
  }

  async create(doc: DBMultistreamTarget) {
    throw new Error("Unimplemented API, use fillAndCreate instead");
    return doc;
  }

  async getAuthed(
    id: string,
    userId: string,
    isAdmin: boolean,
    opts?: GetOptions,
  ) {
    const target = await super.get(id, opts);
    return isAdmin || userId === target?.userId ? target : null;
  }

  async hasAccess(id: string, userId: string, isAdmin: boolean = false) {
    return !!(await this.getAuthed(id, userId, isAdmin));
  }
}
