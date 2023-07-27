import { SymbolMongoModel } from './symbol.dto';

/**
 * @typedef {Object} ExtendedSymbolMongoModel
 */
export type ExtendedSymbolMongoModel = {
  symbol?: SymbolMongoModel;
  contract?: string;
  [key: string]: unknown;
};

/**
 * @typedef {Object} ExtendedSymbolRawModel
 */
export type ExtendedSymbolRawModel = {
  sym?: string;
  contract?: string;
  [key: string]: unknown;
};
