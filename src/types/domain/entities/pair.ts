import { removeUndefinedProperties } from '@alien-worlds/api-core';
import { PairModel } from '../../data';

export class Pair<KeyType = string, ValueType = string> {
  public static create<KeyType = string, ValueType = string>(
    key: KeyType,
    value: ValueType,
    first: KeyType,
    second: ValueType
  ): Pair<KeyType, ValueType> {
    //
    return new Pair(key, value, first, second);
  }

  public static getDefault(): Pair {
    return new Pair('', '', '', '');
  }

  constructor(
    public readonly key: KeyType,
    public readonly value: ValueType,
    public readonly first: KeyType,
    public readonly second: ValueType
  ) {}

  public toJSON(): PairModel<KeyType, ValueType> {
    const { key, value, first, second } = this;
    const pair = { key, value, first, second };

    return removeUndefinedProperties(pair);
  }
}
