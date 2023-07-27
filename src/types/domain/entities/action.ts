import { Entity, UnknownObject } from '@alien-worlds/api-core';
import { ActionRawModel } from '../../data';
import { Bytes } from './bytes';
import { PermissionLevel } from './permission-level';

export class Action implements Entity {
  public static create(
    account: string,
    name: string,
    authorization: PermissionLevel,
    data: Bytes
  ): Action {
    return new Action(account, name, authorization, data);
  }

  public static getDefault(): Action {
    return new Action('', '', PermissionLevel.getDefault(), Bytes.getDefault());
  }

  public rest?: UnknownObject;

  constructor(
    public readonly account: string,
    public readonly name: string,
    public readonly authorization: PermissionLevel,
    public readonly data: Bytes
  ) {}

  public toJSON(): ActionRawModel {
    const { account, name, authorization, data } = this;
    return {
      account,
      name,
      authorization: authorization.toJSON(),
      data: data.raw,
    };
  }
}
