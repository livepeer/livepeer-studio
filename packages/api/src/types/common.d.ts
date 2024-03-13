import { Ingest, Price } from "../middleware/hardcoded-nodes";
import { Stream, User, ApiToken, Project } from "../schema/types";
import { WithID } from "../store/types";
import Queue from "../store/queue";
import { TaskScheduler } from "../task/scheduler";
import { CliArgs } from "../parse-cli";
import Stripe from "stripe";

export interface NodeAddress {
  address: string;
  cliAddress?: string;
}

export interface OrchestratorNodeAddress extends NodeAddress {
  score: number;
}

export interface Ingest {
  origin?: string;
  base?: string;
  ingest: string;
  playback: string;
}

export interface Price {
  address: string;
  priceInfo: {
    pricePerUnit: string;
    pixelsPerUnit: string;
  };
}

declare global {
  namespace Express {
    // add custom properties to Request object
    export interface Request {
      config?: CliArgs;
      store?: IStore;
      queue?: Queue;
      taskScheduler?: TaskScheduler;
      stripe?: Stripe;
      frontendDomain: string;
      catalystBaseUrl: string;
      user?: User;
      project?: Project;
      isUIAdmin?: boolean;
      isNeverExpiringJWT?: boolean;
      token?: WithID<ApiToken>;

      getBroadcasters?: () => Promise<NodeAddress[]>;
      orchestratorsGetters?: Array<() => Promise<OrchestratorNodeAddress[]>>;
      getIngest?: () => Promise<Ingest[]>;
      getPrices?: () => Promise<Price[]>;
    }
  }
}

export type StoredObject = Stream | User | ApiToken;

export interface IStoreListArgs {
  prefix: string;
  cursor?: any;
  limit?: number;
  cleanWriteOnly?: boolean;
  filter?: (obj: { [key: string]: StoredObject }) => boolean;
}

export interface IStoreQueryArgs {
  kind: string;
  query: object;
  cursor?: any;
  limit?: number;
  cleanWriteOnly?: boolean;
}

export interface IStoreQueryObjectsArgs {
  kind: string;
  query: object;
  cursor?: any;
  limit?: number | string;
  cleanWriteOnly?: boolean;
  filter?: (obj: StoredObject) => boolean;
}

export interface IStore {
  ready: Promise<void>;

  get<T extends StoredObject>(id: string, cleanWriteOnly?: boolean): Promise<T>;
  close(): Promise<void>;
  replace(data: StoredObject): Promise<void>;
  list<T = StoredObject>(
    args: IStoreListArgs
  ): Promise<{ data: Array<T>; cursor: string }>;
  listKeys(
    prefix: string,
    cursor?: string,
    limit?: number
  ): Promise<[Array<string>, string]>;
  query(
    args: IStoreQueryArgs
  ): Promise<{ data: Array<string>; cursor: string }>;
  queryObjects<T = StoredObject>(
    args: IStoreQueryObjectsArgs
  ): Promise<{ data: Array<T>; cursor: string }>;
  deleteKey(key: string): Promise<void>;
  delete(id: string): Promise<void>;
  create(data: StoredObject): Promise<StoredObject>;
}

export interface IStoreBackend {
  close(): Promise<void>;
  listKeys(
    prefix: string,
    cursor: any,
    limit: number
  ): Promise<[Array<string>, any]>;
  list(
    prefix: string,
    cursor: any,
    limit: number
  ): Promise<{ data: Array<StoredObject>; cursor: any }>;
  get(id: string): Promise<StoredObject>;
  create(key: string, data: StoredObject): Promise<StoredObject>;
  replace(key: string, data: StoredObject): Promise<void>;
  delete(id: string): Promise<void>;
}

// Type utilities

type Camel<T extends string> = T extends `${infer Left}-${infer Right}`
  ? Camel<`${Left}${Capitalize<Right>}`>
  : T;

export type CamelKeys<T> = {
  [K in keyof T as K extends string ? Camel<K> : K]: T[K];
};
