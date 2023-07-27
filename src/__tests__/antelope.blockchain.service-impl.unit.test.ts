import { AntelopeBlockchainServiceImpl } from '../blockchain/antelope.blockchain.service-impl';
import { Result } from '@alien-worlds/aw-core';

describe('BlockchainServiceImpl', () => {
  let rpc;
  let blockchainService;

  beforeEach(() => {
    rpc = {
      getInfo: jest.fn(),
      getHeadBlockNumber: jest.fn(),
      getLastIrreversibleBlockNumber: jest.fn(),
    };

    blockchainService = new AntelopeBlockchainServiceImpl(rpc);
  });

  describe('getInfo', () => {
    it('should return a successful result with blockchain information', async () => {
      const expectedInfo = { server_version: 'server1.1' };
      rpc.getInfo.mockResolvedValue(expectedInfo);

      const result = await blockchainService.getInfo();

      expect(result).toBeInstanceOf(Result);
      expect(result.isFailure).toBe(false);
      expect(result.content).toBe(expectedInfo);
      expect(rpc.getInfo).toHaveBeenCalled();
    });

    it('should return a failure result if an error occurs', async () => {
      const expectedError = new Error('Something went wrong');
      rpc.getInfo.mockRejectedValue(expectedError);

      const result = await blockchainService.getInfo();

      expect(result).toBeInstanceOf(Result);
      expect(result.isFailure).toBe(true);
      expect(result.failure.error).toBe(expectedError);
      expect(rpc.getInfo).toHaveBeenCalled();
    });
  });

  describe('getHeadBlockNumber', () => {
    it('should return a successful result with the head block number', async () => {
      const expectedBlockNumber = BigInt(12345);
      rpc.getHeadBlockNumber.mockResolvedValue(expectedBlockNumber);

      const result = await blockchainService.getHeadBlockNumber();

      expect(result).toBeInstanceOf(Result);
      expect(result.isFailure).toBe(false);
      expect(result.content).toBe(expectedBlockNumber);
      expect(rpc.getHeadBlockNumber).toHaveBeenCalled();
    });

    it('should return a failure result if an error occurs', async () => {
      const expectedError = new Error('Something went wrong');
      rpc.getHeadBlockNumber.mockRejectedValue(expectedError);

      const result = await blockchainService.getHeadBlockNumber();

      expect(result).toBeInstanceOf(Result);
      expect(result.isFailure).toBe(true);
      expect(rpc.getHeadBlockNumber).toHaveBeenCalled();
    });
  });

  describe('getLastIrreversibleBlockNumber', () => {
    it('should return a successful result with the last irreversible block number', async () => {
      const expectedBlockNumber = BigInt(54321);
      rpc.getLastIrreversibleBlockNumber.mockResolvedValue(expectedBlockNumber);

      const result = await blockchainService.getLastIrreversibleBlockNumber();

      expect(result).toBeInstanceOf(Result);
      expect(result.isFailure).toBe(false);
      expect(result.content).toBe(expectedBlockNumber);
      expect(rpc.getLastIrreversibleBlockNumber).toHaveBeenCalled();
    });

    it('should return a failure result if an error occurs', async () => {
      const expectedError = new Error('Something went wrong');
      rpc.getLastIrreversibleBlockNumber.mockRejectedValue(expectedError);

      const result = await blockchainService.getLastIrreversibleBlockNumber();

      expect(result).toBeInstanceOf(Result);
      expect(result.isFailure).toBe(true);
      expect(result.failure.error).toBe(expectedError);
      expect(rpc.getLastIrreversibleBlockNumber).toHaveBeenCalled();
    });
  });
});
