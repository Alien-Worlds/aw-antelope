import {
  MongoCollectionSource,
  MongoConfig,
  MongoQueryBuilders,
  MongoSource,
} from '@alien-worlds/aw-storage-mongodb';
import { ShipAbiMongoModel, ShipAbiRepositoryImpl, ShipAbisMongoMapper } from './ship';
import { AntelopeSerializer } from '../serializer';
import { BlockReaderConfig, log } from '@alien-worlds/aw-core';
import { AntelopeBlockReaderSource } from './antelope.block-reader.source';
import { AntelopeBlockReader } from './antelope.block-reader';

export class AntelopeBlockReaderFactory {
  public static async create(
    mongo: MongoSource | MongoConfig,
    config: BlockReaderConfig
  ) {
    log(` *  Block Reader ... [starting]`);
    let mongoSource: MongoSource;
    if (mongo instanceof MongoSource) {
      mongoSource = mongo;
    } else {
      mongoSource = await MongoSource.create(mongo);
    }

    const repository = new ShipAbiRepositoryImpl(
      new MongoCollectionSource<ShipAbiMongoModel>(
        mongoSource,
        'history_tools.ship_abis'
      ),
      new ShipAbisMongoMapper(),
      new MongoQueryBuilders()
    );
    const source = new AntelopeBlockReaderSource(config);
    const reader = new AntelopeBlockReader(source, repository, new AntelopeSerializer());

    log(` *  Block Reader ... [ready]`);
    return reader;
  }
}
