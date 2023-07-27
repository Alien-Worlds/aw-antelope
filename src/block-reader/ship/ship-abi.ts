import { ShipAbiModel } from './ship-abi.types';

/**
 * Represents an ABI associated with a StateHistoryPlugin (SHIP).
 * This class holds information about the version, ABI, and last modified timestamp of the SHIP abi.
 * The last modified timestamp is used to track when changes to the ABI were made.
 *
 * @class
 */
export class ShipAbi {
  /**
   * Create a `ShipAbi` object from its JSON representation.
   *
   * @static
   * @param {ShipAbiModel} model - The JSON representation of the `ShipAbi` object.
   * @returns {ShipAbi} The created `ShipAbi` object.
   */
  public static create(model: ShipAbiModel): ShipAbi {
    const { abi, version, last_modified_timestamp } = model;
    return new ShipAbi(abi, version, last_modified_timestamp);
  }

  /**
   * Create a `ShipAbi` object.
   *
   * @param {string} abi - The ABI hex.
   * @param {string} version - The version of the ABI.
   * @param {Date} lastModifiedTimestamp - The last modified timestamp of the ABI.
   */
  constructor(
    public readonly abi: string,
    public readonly version: string,
    public readonly lastModifiedTimestamp: Date
  ) {}

  /**
   * Convert the `ShipAbi` object to its JSON representation.
   *
   * @returns {ShipAbiModel} The JSON representation of the `ShipAbi` object.
   */
  public toJSON(): ShipAbiModel {
    const { abi, version, lastModifiedTimestamp: last_modified_timestamp } = this;
    return {
      abi,
      version,
      last_modified_timestamp,
    };
  }
}
