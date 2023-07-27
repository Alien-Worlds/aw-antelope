import { Failure } from '@alien-worlds/aw-core';
import { ShipAbiNotFoundError } from '../../antelope.block-reader.errors';
import { ShipAbiRepositoryImpl } from '../ship-abi.repository-impl';

describe('ShipAbiRepositoryImpl', () => {
  let repository: ShipAbiRepositoryImpl;
  const abi = { version: '1.0' };
  const buffer = Buffer.from(JSON.stringify(abi), 'utf-8');
  const hex = buffer.toString('hex');
  const lastModifiedTimestamp = new Date();

  beforeEach(() => {
    repository = new ShipAbiRepositoryImpl({} as any, {} as any, {} as any);
  });

  describe('updateAbi', () => {
    it('should update the ABI', async () => {
      repository.update = jest.fn().mockResolvedValue({});
      const result = await repository.updateAbi('1.0', abi);

      expect(repository.update).toHaveBeenCalled();
      expect(result).toEqual({});
    });
  });

  describe('getAbi', () => {
    it('should return the ABI for the specified version', async () => {
      const version = '1.0';
      repository.find = jest.fn().mockResolvedValue({
        content: [{ abi: hex }],
        failure: undefined,
      });

      const result = await repository.getAbi(version);

      expect(repository.find).toHaveBeenCalled();
      expect(result.isFailure).toBe(false);
      expect(result.content).toEqual(abi);
    });

    it('should return an AbiNotFoundError when no ABI is found for the specified version', async () => {
      const version = '1.0';

      repository.find = jest.fn().mockResolvedValue({ content: [], failure: undefined });

      const result = await repository.getAbi(version);

      expect(repository.find).toHaveBeenCalled();
      expect(result.isFailure).toBe(true);
      expect(result.failure?.error).toBeInstanceOf(ShipAbiNotFoundError);
    });

    it('should return a failure result when an error occurs during retrieval', async () => {
      const version = '1.0';

      repository.find = jest.fn().mockResolvedValue({
        content: undefined,
        failure: Failure.withMessage('Failed to retrieve ABI'),
      });

      const result = await repository.getAbi(version);

      expect(repository.find).toHaveBeenCalled();
      expect(result.isFailure).toBe(true);
      expect(result.failure?.error).toEqual(new Error('Failed to retrieve ABI'));
    });
  });
});
