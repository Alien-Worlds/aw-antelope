import {
  MongoCollectionSource,
  MongoConfig,
  MongoQueryBuilders,
  MongoSource,
} from '@alien-worlds/aw-storage-mongodb';
import { ShipAbisMongoMapper } from './ship-abis.mongo.mapper';
import { ShipAbis } from './ship-abis';
import { log } from '@alien-worlds/aw-core';
import { ShipAbiMongoModel } from './ship-abi.types';
import { ShipAbiRepositoryImpl } from './ship-abi.repository-impl';

/**
 * @class
 */
export class ShipAbisFactory {
  public static async create(mongo: MongoSource | MongoConfig): Promise<ShipAbis> {
    let mongoSource: MongoSource;

    log(` *  SHIP ABis ... [starting]`);

    if (mongo instanceof MongoSource) {
      mongoSource = mongo;
    } else {
      mongoSource = await MongoSource.create(mongo);
    }
    const source = new MongoCollectionSource<ShipAbiMongoModel>(
      mongoSource,
      'history_tools.ship_abis'
    );
    const mapper = new ShipAbisMongoMapper();
    const repository = new ShipAbiRepositoryImpl(
      source,
      mapper,
      new MongoQueryBuilders()
    );
    const ship = new ShipAbis(repository);

    log(` *  SHIP ABis ... [ready]`);
    return ship;
  }
}
