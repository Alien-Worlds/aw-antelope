import { BlockchainService } from '@alien-worlds/aw-core';
import { AntelopeBlockchainServiceImpl } from './antelope.blockchain.service-impl';
import { AntelopeRpcSourceImpl } from './antelope.rpc.source-impl';

type BlockchainServiceConfig = {
  endpoint: string;
  [key: string]: unknown;
};

export class AntelopeBlockchainServiceFactory {
  public static create(config: BlockchainServiceConfig): BlockchainService {
    return new AntelopeBlockchainServiceImpl(new AntelopeRpcSourceImpl(config.endpoint));
  }
}
