import { Entity, UnknownObject } from '@alien-worlds/api-core';
import { ExtensionRawModel } from '../../data/dtos/extension.dto';

export class Extension implements Entity {
  public static create(type: number, data: string, rest?: UnknownObject): Extension {
    const entity = new Extension(type, data);
    entity.rest = rest;

    return entity;
  }

  public static getDefault(): Extension {
    return new Extension(0, '');
  }

  public rest?: UnknownObject;

  constructor(public readonly type: number, public readonly data: string) {}

  public toJSON(): ExtensionRawModel {
    const { type, data } = this;
    return {
      type,
      data,
    };
  }
}
