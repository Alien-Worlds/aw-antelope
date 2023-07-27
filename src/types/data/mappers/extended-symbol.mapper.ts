import { ExtendedSymbolMongoModel, ExtendedSymbolRawModel } from '../dtos';
import { SymbolMongoMapper, SymbolRawMapper } from './symbol.mapper';

import { ExtendedSymbol } from '../../domain/entities/extended-symbol';
/* eslint-disable @typescript-eslint/ban-types */
import { MapperImpl } from '@alien-worlds/aw-core';
import { MongoMapper } from '@alien-worlds/aw-storage-mongodb';
import { Symbol } from '../../domain/entities';

// Mongo Mappers
export class ExtendedSymbolMongoMapper extends MongoMapper<
  ExtendedSymbol,
  ExtendedSymbolMongoModel
> {
  constructor() {
    super();

    this.mappingFromEntity.set('symbol', {
      key: 'symbol',
      mapper: (value: Symbol) => new SymbolMongoMapper().fromEntity(value),
    });

    this.mappingFromEntity.set('contract', {
      key: 'contract',
      mapper: (value: string) => value,
    });
  }

  public toEntity(mongoModel: ExtendedSymbolMongoModel): ExtendedSymbol {
    const { symbol, contract, ...rest } = mongoModel;

    return ExtendedSymbol.create(
      symbol ? new SymbolMongoMapper().toEntity(symbol) : Symbol.getDefault(),
      contract ?? '',
      rest
    );
  }
}

// Raw mappers
export class ExtendedSymbolRawMapper extends MapperImpl<
  ExtendedSymbol,
  ExtendedSymbolRawModel
> {
  public fromEntity(entity: ExtendedSymbol): ExtendedSymbolRawModel {
    throw new Error('Method not implemented');
  }

  public toEntity(rawModel: ExtendedSymbolRawModel): ExtendedSymbol {
    const { sym, contract } = rawModel;

    return ExtendedSymbol.create(
      sym ? new SymbolRawMapper().toEntity(sym) : Symbol.getDefault(),
      contract ?? ''
    );
  }
}
