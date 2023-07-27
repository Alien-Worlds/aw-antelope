import { Failure, Result } from '@alien-worlds/aw-core';
import { ShipAbiRepository } from '../ship-abi.repository';
import { ShipAbis } from '../ship-abis';
import { DefaultAbi } from '../ship-abi.types';

describe('ShipAbis', () => {
  const repositoryMock: ShipAbiRepository = {
    getAbi: jest.fn(),
  } as any;

  const abi = { version: '1.0' };
  const version = 'eosio::abi/1.1';
  const failure = Failure.withMessage('Failed to retrieve ABI');
  const shipAbiResult: Result<DefaultAbi> = Result.withContent(abi);
  const failureResult: Result<string> = Result.withFailure(failure);

  describe('getAbi', () => {
    it('should return the ABI from cache if it exists', async () => {
      const shipAbis = new ShipAbis(repositoryMock);
      shipAbis['cache'].set(version, abi);

      const result = await shipAbis.getAbi(version);

      expect(repositoryMock.getAbi).not.toHaveBeenCalled();
      expect(result).toEqual(shipAbiResult);
    });

    it('should retrieve the ABI from the repository if it is not in cache', async () => {
      (repositoryMock.getAbi as jest.Mock).mockResolvedValueOnce({
        content: abi,
        failure: undefined,
      });

      const shipAbis = new ShipAbis(repositoryMock);
      const result = await shipAbis.getAbi(version);

      expect(repositoryMock.getAbi).toHaveBeenCalledWith(version);
      expect(result).toEqual(shipAbiResult);
      expect(shipAbis['cache'].get(version)).toEqual(abi);
    });

    it('should return the failure result if the repository call fails', async () => {
      (repositoryMock.getAbi as jest.Mock).mockResolvedValueOnce({
        content: undefined,
        failure,
      });

      const shipAbis = new ShipAbis(repositoryMock);
      const result = await shipAbis.getAbi(version);

      expect(repositoryMock.getAbi).toHaveBeenCalledWith(version);
      expect(result).toEqual(failureResult);
      expect(shipAbis['cache'].get(version)).toBeUndefined();
    });
  });
});
