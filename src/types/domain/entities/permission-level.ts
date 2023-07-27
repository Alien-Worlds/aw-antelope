import { Entity, UnknownObject } from '@alien-worlds/api-core';
import { PermissionLevelRawModel } from '../../data';

export class PermissionLevel implements Entity {
  public static create(
    actor: string,
    permission: string,
    rest?: UnknownObject
  ): PermissionLevel {
    const entity = new PermissionLevel(actor, permission);
    entity.rest = rest;
    return entity;
  }

  public static getDefault(): PermissionLevel {
    return new PermissionLevel('', '');
  }

  constructor(public readonly actor: string, public readonly permission: string) {}

  public rest?: UnknownObject;

  public toJSON(): PermissionLevelRawModel {
    const { actor, permission } = this;
    return { actor, permission };
  }
}
