/**
 * @typedef {Object} PermissionLevelMongoModel
 */
export type PermissionLevelMongoModel = {
  actor?: string;
  permission?: string;
  [key: string]: unknown;
};

/**
 * @typedef {Object} PermissionLevelRawModel
 */
export type PermissionLevelRawModel = {
  actor?: string;
  permission?: string;
  [key: string]: unknown;
};
