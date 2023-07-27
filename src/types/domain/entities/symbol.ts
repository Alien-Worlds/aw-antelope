/* eslint-disable @typescript-eslint/ban-types */
import { Entity, UnknownObject } from '@alien-worlds/api-core';

/**
 * Represents a `Symbol` object.
 *
 * @class
 */
export class Symbol implements Entity {
  /**
   * Constructs a new instance of the `Symbol` class.
   *
   * @public
   * @constructor
   * @param number precision
   * @param string code
   * @returns `Symbol` - An instance of the `Symbol` class.
   */
  public constructor(public precision: number, public code: string) {}

  public rest?: UnknownObject;

  /**
   * Converts the current instance of the `Symbol` class to a JSON object.
   *
   * @public
   * @returns {UnknownObject} The JSON representation of the instance.
   */
  public toJSON(): UnknownObject {
    return {
      precision: this.precision,
      code: this.code,
    };
  }

  /**
   * Creates an instance of the `Symbol` class.
   *
   * @static
   * @public
   * @returns `Symbol` An instance of the `Symbol` class.
   */
  public static create(precision: number, code: string, rest?: UnknownObject): Symbol {
    const entity = new Symbol(precision, code);
    entity.rest = rest;

    return entity;
  }

  public static getDefault(): Symbol {
    return new Symbol(0, '');
  }
}
