import { Mapper, PropertyMapping } from '@alien-worlds/aw-core';
import { ShipAbi } from './ship-abi';
import { ShipAbiMongoModel } from './ship-abi.types';

export class ShipAbisMongoMapper implements Mapper<ShipAbi, ShipAbiMongoModel> {
  public toEntity(model: ShipAbiMongoModel): ShipAbi {
    const { abi, version, last_modified_timestamp } = model;
    return new ShipAbi(abi, version, last_modified_timestamp);
  }

  public fromEntity(entity: ShipAbi): ShipAbiMongoModel {
    const { abi, version, lastModifiedTimestamp } = entity;

    return {
      abi,
      version,
      last_modified_timestamp: lastModifiedTimestamp,
    };
  }

  getEntityKeyMapping(key: string): PropertyMapping {
    throw new Error('Method not implemented.');
  }
}
