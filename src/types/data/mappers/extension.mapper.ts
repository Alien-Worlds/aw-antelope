import { MapperImpl } from '@alien-worlds/api-core';

import { Extension } from '../../domain/entities';
import { ExtensionMongoModel, ExtensionRawModel } from '../dtos/extension.dto';
import { MongoMapper } from '@alien-worlds/storage-mongodb';

// Mongo Mappers
export class ExtensionMongoMapper extends MongoMapper<Extension, ExtensionMongoModel> {
  constructor() {
    super();

    this.mappingFromEntity.set('type', {
      key: 'type',
      mapper: (value: number) => value,
    });

    this.mappingFromEntity.set('data', {
      key: 'data',
      mapper: (value: string) => value,
    });
  }

  public toEntity(mongoModel: ExtensionMongoModel): Extension {
    const { type, data, ...rest } = mongoModel;

    const entity = Extension.create(type ?? 0, data ?? '');
    entity.rest = rest;
    return entity;
  }
}

// Raw mappers
export class ExtensionRawMapper extends MapperImpl<Extension, ExtensionRawModel> {
  public fromEntity(entity: Extension): ExtensionRawModel {
    const { type, data, rest } = entity;
    const item = { type, data };

    if (rest) {
      Object.assign(item, rest);
    }

    return item;
  }

  public toEntity(rawModel: ExtensionRawModel): Extension {
    const { type, data, ...rest } = rawModel;

    const entity = Extension.create(type ?? 0, data ?? '');
    entity.rest = rest;
    return entity;
  }
}
