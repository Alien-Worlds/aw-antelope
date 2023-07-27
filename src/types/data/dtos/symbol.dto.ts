/**
 * @typedef {Object} SymbolMongoModel
 */
export type SymbolMongoModel = {
  precision?: number;
  code?: string;
  [key: string]: unknown;
};

/**
 * @typedef {Object} SymbolRawModel
 */
export type SymbolRawModel = string;
