import { MapperImpl } from '@alien-worlds/api-core';

import { PermissionLevel } from '../../domain/entities';
import {
  PermissionLevelMongoModel,
  PermissionLevelRawModel,
} from '../dtos/permission-level.dto';
import { MongoMapper } from '@alien-worlds/storage-mongodb';

// Mongo Mappers
export class PermissionLevelMongoMapper extends MongoMapper<
  PermissionLevel,
  PermissionLevelMongoModel
> {
  constructor() {
    super();

    this.mappingFromEntity.set('actor', {
      key: 'actor',
      mapper: (value: string) => value,
    });

    this.mappingFromEntity.set('permission', {
      key: 'permission',
      mapper: (value: string) => value,
    });
  }

  public toEntity(mongoModel: PermissionLevelMongoModel): PermissionLevel {
    const { actor, permission, ...rest } = mongoModel;

    return PermissionLevel.create(actor, permission, rest);
  }
}

// Raw mappers
export class PermissionLevelRawMapper extends MapperImpl<
  PermissionLevel,
  PermissionLevelRawModel
> {
  public fromEntity(entity: PermissionLevel): PermissionLevelRawModel {
    const { actor, permission, rest } = entity;

    const item = {
      actor,
      permission,
      ...rest,
    };

    if (rest) {
      Object.assign(item, rest);
    }

    return item;
  }

  public toEntity(rawModel: PermissionLevelRawModel): PermissionLevel {
    const { actor, permission, ...rest } = rawModel;

    return PermissionLevel.create(actor, permission, rest);
  }
}
