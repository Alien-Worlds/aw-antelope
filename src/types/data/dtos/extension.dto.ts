/**
 * @typedef {Object} ExtensionMongoModel
 */
export type ExtensionMongoModel = {
  type?: number;
  data?: string;
  [key: string]: unknown;
};

export type ExtensionRawModel = {
  type?: number;
  data?: string;
  [key: string]: unknown;
};
