import { MongoDB } from '@alien-worlds/storage-mongodb';
import {
  PermissionLevelMongoModel,
  PermissionLevelRawModel,
} from './permission-level.dto';

/**
 * @typedef {Object} ActionMongoModel
 */
export type ActionMongoModel = {
  account?: string;
  name?: string;
  authorization?: PermissionLevelMongoModel;
  data?: MongoDB.Binary;
  [key: string]: unknown;
};

/**
 * @typedef {Object} ActionRawModel
 */
export type ActionRawModel = {
  account?: string;
  name?: string;
  authorization?: PermissionLevelRawModel;
  data?: string;
  [key: string]: unknown;
};
