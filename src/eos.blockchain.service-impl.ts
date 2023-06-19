import {
  BlockchainInfo,
  BlockchainService,
  Failure,
  Result,
  RpcSource,
} from '@alien-worlds/api-core';

/**
 * Implementation of the BlockchainService interface that communicates with a blockchain network.
 * @implements {BlockchainService}
 */
export class EosBlockchainServiceImpl implements BlockchainService {
  /**
   * Creates an instance of BlockchainServiceImpl.
   * @param {RpcSource} rpc - The RPC data source used to communicate with the blockchain network.
   */
  constructor(protected rpc: RpcSource) {}

  /**
   * Retrieves the blockchain information.
   * @returns {Promise<BlockchainInfo>} A promise that resolves with the blockchain information.
   */
  public async getInfo(): Promise<Result<BlockchainInfo>> {
    try {
      const info = await this.rpc.getInfo();
      return Result.withContent(info);
    } catch (error) {
      return Result.withFailure(Failure.fromError(error));
    }
  }

  /**
   * Retrieves the block number of the head block.
   * @returns {Promise<bigint>} A promise that resolves with the head block number.
   */
  public async getHeadBlockNumber(): Promise<Result<bigint>> {
    try {
      const blockNumber = await this.rpc.getHeadBlockNumber();
      return Result.withContent(blockNumber);
    } catch (error) {
      return Result.withFailure(Failure.fromError(error));
    }
  }

  /**
   * Retrieves the block number of the last irreversible block.
   * @returns {Promise<bigint>} A promise that resolves with the last irreversible block number.
   */
  public async getLastIrreversibleBlockNumber(): Promise<Result<bigint>> {
    try {
      const blockNumber = await this.rpc.getLastIrreversibleBlockNumber();
      return Result.withContent(blockNumber);
    } catch (error) {
      return Result.withFailure(Failure.fromError(error));
    }
  }
}
