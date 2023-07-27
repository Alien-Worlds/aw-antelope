import { MapperImpl } from '@alien-worlds/api-core';

import { Action, PermissionLevel } from '../../domain/entities';
import { ActionMongoModel, ActionRawModel } from '../dtos/action.dto';
import {
  PermissionLevelMongoMapper,
  PermissionLevelRawMapper,
} from './permission-level.mapper';
import { BytesMongoMapper, BytesRawMapper } from './bytes.mapper';
import { MongoMapper } from '@alien-worlds/storage-mongodb';

// Mongo Mappers
export class ActionMongoMapper extends MongoMapper<Action, ActionMongoModel> {
  private permissionLevelMapper = new PermissionLevelMongoMapper();
  private bytesMapper = new BytesMongoMapper();

  constructor() {
    super();

    this.mappingFromEntity.set('account', {
      key: 'account',
      mapper: (value: string) => value,
    });

    this.mappingFromEntity.set('name', {
      key: 'name',
      mapper: (value: string) => value,
    });

    this.mappingFromEntity.set('data', {
      key: 'data',
      mapper: (value: string) => value,
    });

    this.mappingFromEntity.set('authorization', {
      key: 'authorization',
      mapper: (value: PermissionLevel) => this.permissionLevelMapper.fromEntity(value),
    });
  }

  public toEntity(mongoModel: ActionMongoModel): Action {
    const { account, name, authorization, data, ...rest } = mongoModel;

    const entity = Action.create(
      account,
      name,
      this.permissionLevelMapper.toEntity(authorization),
      this.bytesMapper.toEntity(data)
    );
    entity.rest = rest;

    return entity;
  }
}

// Raw mappers
export class ActionRawMapper extends MapperImpl<Action, ActionRawModel> {
  private permissionLevelMapper = new PermissionLevelRawMapper();
  private bytesMapper = new BytesRawMapper();

  public fromEntity(entity: Action): ActionRawModel {
    const { account, name, rest } = entity;
    const authorization = this.permissionLevelMapper.fromEntity(entity.authorization);
    const data = this.bytesMapper.fromEntity(entity.data);

    const item = {
      account,
      name,
      authorization,
      data,
    };

    if (rest) {
      Object.assign(item, rest);
    }

    return item;
  }

  public toEntity(rawModel: ActionRawModel): Action {
    const { account, name } = rawModel;
    const authorization = this.permissionLevelMapper.toEntity(rawModel.authorization);
    const data = this.bytesMapper.toEntity(rawModel.data);

    return Action.create(account, name, authorization, data);
  }
}
