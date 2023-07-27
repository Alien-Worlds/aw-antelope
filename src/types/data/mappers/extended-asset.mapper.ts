import { MapperImpl } from '@alien-worlds/api-core';

import { Asset } from '../../domain/entities';
import { ExtendedAsset } from '../../domain/entities/extended-asset';
import { ExtendedAssetMongoModel, ExtendedAssetRawModel } from '../dtos';
import { AssetMongoMapper, AssetRawMapper } from './asset.mapper';
import { MongoMapper } from '@alien-worlds/storage-mongodb';

// Mongo Mappers
export class ExtendedAssetMongoMapper extends MongoMapper<
  ExtendedAsset,
  ExtendedAssetMongoModel
> {
  constructor() {
    super();

    this.mappingFromEntity.set('quantity', {
      key: 'quantity',
      mapper: (value: Asset) => new AssetMongoMapper().fromEntity(value),
    });

    this.mappingFromEntity.set('contract', {
      key: 'contract',
      mapper: (value: string) => value,
    });
  }

  public toEntity(mongoModel: ExtendedAssetMongoModel): ExtendedAsset {
    const { contract, quantity, ...rest } = mongoModel;

    return ExtendedAsset.create(
      quantity ? new AssetMongoMapper().toEntity(quantity) : Asset.getDefault(),
      contract ?? '',
      rest
    );
  }
}

// Raw mappers
export class ExtendedAssetRawMapper extends MapperImpl<
  ExtendedAsset,
  ExtendedAssetRawModel
> {
  public fromEntity(entity: ExtendedAsset): ExtendedAssetRawModel {
    throw new Error('Method not implemented');
  }

  public toEntity(rawModel: ExtendedAssetRawModel): ExtendedAsset {
    const { quantity, contract } = rawModel;

    return ExtendedAsset.create(
      quantity ? new AssetRawMapper().toEntity(quantity) : Asset.getDefault(),
      contract ?? ''
    );
  }
}
