import {
  MongoCollectionSource,
  MongoConfig,
  MongoQueryBuilders,
  MongoSource,
} from '@alien-worlds/aw-storage-mongodb';
import { AntelopeSerializer } from '.';
import {
  ShipAbiMongoModel,
  ShipAbiRepositoryImpl,
  ShipAbisMongoMapper,
} from '../block-reader';

export class AntelopeSerializerFactory {
  public static async create(mongo: MongoSource | MongoConfig, logErrors = true) {
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

    const serializer = new AntelopeSerializer(repository, logErrors);

    return serializer;
  }
}
