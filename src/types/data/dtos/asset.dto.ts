/**
 * @typedef {Object} AssetMongoModel
 */
export type AssetMongoModel = {
  value?: number;
  symbol?: string;
  [key: string]: unknown;
};

/**
 * @typedef {Object} AssetRawModel
 */
export type AssetRawModel = string;
