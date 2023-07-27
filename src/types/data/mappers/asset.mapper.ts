import { MapperImpl } from '@alien-worlds/api-core';

import { Asset } from '../../domain/entities';
import { AssetMongoModel, AssetRawModel } from '../dtos/asset.dto';
import { MongoMapper } from '@alien-worlds/storage-mongodb';

// Mongo Mappers
export class AssetMongoMapper extends MongoMapper<Asset, AssetMongoModel> {
  constructor() {
    super();

    this.mappingFromEntity.set('value', {
      key: 'value',
      mapper: (value: number) => value,
    });

    this.mappingFromEntity.set('symbol', {
      key: 'symbol',
      mapper: (value: string) => value,
    });
  }

  public toEntity(mongoModel: AssetMongoModel): Asset {
    const { value, symbol, ...rest } = mongoModel;

    return Asset.create(value ?? 0, symbol ?? '', rest);
  }
}

// Raw mappers
export class AssetRawMapper extends MapperImpl<Asset, AssetRawModel> {
  public fromEntity(entity: Asset): AssetRawModel {
    const { value, symbol } = entity;

    return `${value.toString()} ${symbol}`;
  }

  public toEntity(rawModel: AssetRawModel): Asset {
    const [value, symbol] = rawModel.split(/\s+/g);

    return Asset.create(Number(value ?? 0), symbol ?? '');
  }
}
