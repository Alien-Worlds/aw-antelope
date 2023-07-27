import { MapperImpl, parseToBigInt } from '@alien-worlds/api-core';

import { Action, Extension, Transaction } from '../../domain/entities';
import { TransactionMongoModel, TransactionRawModel } from '../dtos/transaction.dto';
import { MongoDB, MongoMapper } from '@alien-worlds/storage-mongodb';
import { ActionMongoMapper, ActionRawMapper } from './action.mapper';
import { ExtensionMongoMapper, ExtensionRawMapper } from './extension.mapper';

// Mongo Mappers
export class TransactionMongoMapper extends MongoMapper<
  Transaction,
  TransactionMongoModel
> {
  private actionMapper = new ActionMongoMapper();
  private extensionMapper = new ExtensionMongoMapper();

  constructor() {
    super();

    this.mappingFromEntity.set('expiration', {
      key: 'expiration',
      mapper: (value: Date) => value,
    });

    this.mappingFromEntity.set('refBlockNumber', {
      key: 'ref_block_num',
      mapper: (value: bigint) => MongoDB.Long.fromBigInt(value),
    });

    this.mappingFromEntity.set('refBlockPrefix', {
      key: 'ref_block_prefix',
      mapper: (value: number) => value,
    });

    this.mappingFromEntity.set('maxNetUsageWords', {
      key: 'max_net_usage_words',
      mapper: (value: number) => value,
    });

    this.mappingFromEntity.set('maxCpuUsageMs', {
      key: 'max_cpu_usage_ms',
      mapper: (value: number) => value,
    });

    this.mappingFromEntity.set('delaySec', {
      key: 'delay_sec',
      mapper: (value: number) => value,
    });

    this.mappingFromEntity.set('contextFreeActions', {
      key: 'context_free_actions',
      mapper: (value: Action) => this.actionMapper.fromEntity(value),
    });

    this.mappingFromEntity.set('actions', {
      key: 'actions',
      mapper: (value: Action) => this.actionMapper.fromEntity(value),
    });

    this.mappingFromEntity.set('transactionExtensions', {
      key: 'transaction_extensions',
      mapper: (value: Extension) => this.extensionMapper.fromEntity(value),
    });
  }

  public toEntity(mongoModel: TransactionMongoModel): Transaction {
    const {
      expiration,
      ref_block_num,
      ref_block_prefix,
      max_net_usage_words,
      max_cpu_usage_ms,
      delay_sec,
      context_free_actions,
      actions,
      transaction_extensions,
      ...rest
    } = mongoModel;

    const transaction = Transaction.create(
      expiration,
      parseToBigInt(ref_block_num),
      ref_block_prefix,
      max_net_usage_words,
      max_cpu_usage_ms,
      delay_sec,
      context_free_actions.map(action => this.actionMapper.toEntity(action)),
      actions.map(action => this.actionMapper.toEntity(action)),
      transaction_extensions.map(extension => this.extensionMapper.toEntity(extension))
    );

    transaction.rest = rest;

    return transaction;
  }
}

// Raw mappers
export class TransactionRawMapper extends MapperImpl<Transaction, TransactionRawModel> {
  private actionMapper = new ActionRawMapper();
  private extensionMapper = new ExtensionRawMapper();

  public fromEntity(entity: Transaction): TransactionRawModel {
    const {
      expiration,
      refBlockNumber,
      refBlockPrefix: ref_block_prefix,
      maxNetUsageWords: max_net_usage_words,
      maxCpuUsageMs: max_cpu_usage_ms,
      delaySec: delay_sec,
      contextFreeActions,
      actions,
      transactionExtensions,
      rest,
    } = entity;

    const item = {
      expiration: expiration.toISOString(),
      ref_block_num: Number(refBlockNumber),
      ref_block_prefix,
      max_net_usage_words,
      max_cpu_usage_ms,
      delay_sec,
      context_free_actions: contextFreeActions.map(action => action.toJSON()),
      actions: actions.map(action => action.toJSON()),
      transaction_extensions: transactionExtensions.map(extension => extension.toJSON()),
    };

    if (rest) {
      Object.assign(item, rest);
    }

    return item;
  }

  public toEntity(mongoModel: TransactionRawModel): Transaction {
    const {
      expiration,
      ref_block_num,
      ref_block_prefix,
      max_net_usage_words,
      max_cpu_usage_ms,
      delay_sec,
      context_free_actions,
      actions,
      transaction_extensions,
      ...rest
    } = mongoModel;

    const transaction = Transaction.create(
      new Date(expiration),
      parseToBigInt(ref_block_num),
      ref_block_prefix,
      max_net_usage_words,
      max_cpu_usage_ms,
      delay_sec,
      context_free_actions.map(action => this.actionMapper.toEntity(action)),
      actions.map(action => this.actionMapper.toEntity(action)),
      transaction_extensions.map(extension => this.extensionMapper.toEntity(extension))
    );

    transaction.rest = rest;

    return transaction;
  }
}
