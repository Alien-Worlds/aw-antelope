import { MapperImpl } from '@alien-worlds/api-core';

import { Bytes } from '../../domain/entities';
import { MongoDB, MongoMapper } from '@alien-worlds/storage-mongodb';
import { BytesMongoModel, BytesRawModel } from '../dtos/bytes.dto';

// Mongo Mappers
export class BytesMongoMapper extends MongoMapper<Bytes, BytesMongoModel> {
  public toEntity(mongoModel: BytesMongoModel): Bytes {
    return Bytes.create(mongoModel.toString());
  }

  public fromEntity(entity: Bytes): BytesMongoModel {
    return new MongoDB.Binary(entity.data);
  }
}

// Raw mappers
export class BytesRawMapper extends MapperImpl<Bytes, BytesRawModel> {
  public fromEntity(entity: Bytes): BytesRawModel {
    return entity.raw;
  }

  public toEntity(rawModel: BytesRawModel): Bytes {
    return Bytes.create(rawModel);
  }
}
