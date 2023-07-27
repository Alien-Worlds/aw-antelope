import { UnknownObject } from '@alien-worlds/aw-core';

export type ShipAbiModel = {
  abi: string;
  version: string;
  last_modified_timestamp: Date;
};

export type DefaultAbi = UnknownObject & {
  version: string;
};
