import { Entity, UnknownObject } from '@alien-worlds/api-core';

import { Asset } from './asset';

/**
 * Represents a `ExtendedAsset` object.
 *
 * @class
 */
export class ExtendedAsset implements Entity {
  /**
   * Constructs a new instance of the `ExtendedAsset` class.
   *
   * @public
   * @constructor
   * @param Asset quantity
   * @param string contract
   * @returns `ExtendedAsset` - An instance of the `ExtendedAsset` class.
   */
  public constructor(public quantity: Asset, public contract: string) {}

  public rest?: UnknownObject;

  /**
   * Converts the current instance of the `ExtendedAsset` class to a JSON object.
   *
   * @public
   * @returns {UnknownObject} The JSON representation of the instance.
   */
  public toJSON(): UnknownObject {
    return {
      quantity: this.quantity.toJSON(),
      contract: this.contract,
    };
  }

  /**
   * Creates an instance of the `ExtendedAsset` class.
   *
   * @static
   * @public
   * @returns `ExtendedAsset` An instance of the `ExtendedAsset` class.
   */
  public static create(
    quantity: Asset,
    contract: string,
    rest?: UnknownObject
  ): ExtendedAsset {
    const entity = new ExtendedAsset(quantity, contract);
    entity.rest = rest;

    return entity;
  }

  public static getDefault(): ExtendedAsset {
    return new ExtendedAsset(Asset.getDefault(), '');
  }
}
