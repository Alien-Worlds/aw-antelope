import { UnknownObject } from '@alien-worlds/aw-core';
import { MongoDB } from '@alien-worlds/aw-storage-mongodb';

export type ShipAbiMongoModel = {
  _id?: MongoDB.ObjectId;
  last_modified_timestamp: Date;
  version: string;
  abi: string;
};
export type ShipAbiModel = {
  abi: string;
  version: string;
  last_modified_timestamp: Date;
};

export type DefaultAbi = UnknownObject & {
  version: string;
};
