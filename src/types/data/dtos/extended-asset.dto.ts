import { AssetMongoModel } from './asset.dto';

/**
 * @typedef {Object} ExtendedAssetMongoModel
 */
export type ExtendedAssetMongoModel = {
  contract?: string;
  quantity?: AssetMongoModel;
  [key: string]: unknown;
};

/**
 * @typedef {Object} ExtendedAssetRawModel
 */
export type ExtendedAssetRawModel = {
  contract?: string;
  quantity?: string;
  [key: string]: unknown;
};
