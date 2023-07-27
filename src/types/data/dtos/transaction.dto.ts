import { MongoDB } from '@alien-worlds/storage-mongodb';
import { ActionMongoModel, ActionRawModel } from './action.dto';
import { ExtensionMongoModel, ExtensionRawModel } from './extension.dto';

export type TransactionMongoModel = {
  expiration: Date;
  ref_block_num: MongoDB.Long;
  ref_block_prefix: number;
  max_net_usage_words: number;
  max_cpu_usage_ms: number;
  delay_sec: number;
  context_free_actions: ActionMongoModel[];
  actions: ActionMongoModel[];
  transaction_extensions: ExtensionMongoModel[];
};

export type TransactionRawModel = {
  expiration: string;
  ref_block_num: number;
  ref_block_prefix: number;
  max_net_usage_words: number;
  max_cpu_usage_ms: number;
  delay_sec: number;
  context_free_actions: ActionRawModel[];
  actions: ActionRawModel[];
  transaction_extensions: ExtensionRawModel[];
};
