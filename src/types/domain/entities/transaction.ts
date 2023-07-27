import { Action } from './action';
import { Extension } from './extension';
import { TransactionRawModel } from '../../data';
import { Entity, UnknownObject } from '@alien-worlds/api-core';

export class Transaction implements Entity {
  public static create(
    expiration: Date,
    ref_block_num: bigint,
    ref_block_prefix: number,
    max_net_usage_words: number,
    max_cpu_usage_ms: number,
    delay_sec: number,
    context_free_actions: Action[],
    actions: Action[],
    transaction_extensions: Extension[]
  ): Transaction {
    return new Transaction(
      expiration,
      ref_block_num,
      ref_block_prefix,
      max_net_usage_words,
      max_cpu_usage_ms,
      delay_sec,
      context_free_actions,
      actions,
      transaction_extensions
    );
  }

  public static getDefault(): Transaction {
    return new Transaction(new Date(), 0n, 0, 0, 0, 0, [], [], []);
  }

  public rest?: UnknownObject;

  constructor(
    public readonly expiration: Date,
    public readonly refBlockNumber: bigint,
    public readonly refBlockPrefix: number,
    public readonly maxNetUsageWords: number,
    public readonly maxCpuUsageMs: number,
    public readonly delaySec: number,
    public readonly contextFreeActions: Action[],
    public readonly actions: Action[],
    public readonly transactionExtensions: Extension[]
  ) {}

  public toJSON(): TransactionRawModel {
    const {
      expiration,
      refBlockNumber,
      refBlockPrefix,
      maxNetUsageWords,
      maxCpuUsageMs,
      delaySec,
      contextFreeActions,
      actions,
      transactionExtensions,
    } = this;

    return {
      expiration: expiration.toISOString(),
      ref_block_num: Number(refBlockNumber),
      ref_block_prefix: refBlockPrefix,
      max_net_usage_words: maxNetUsageWords,
      max_cpu_usage_ms: maxCpuUsageMs,
      delay_sec: delaySec,
      context_free_actions: contextFreeActions.map(action => action.toJSON()),
      actions: actions.map(action => action.toJSON()),
      transaction_extensions: transactionExtensions.map(extension => extension.toJSON()),
    };
  }
}
