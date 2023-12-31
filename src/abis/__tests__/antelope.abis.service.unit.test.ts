import { AntelopeAbisService } from '../antelope.abis.service';
import { ContractEncodedAbi } from '@alien-worlds/aw-core';
import fetch from 'node-fetch';

// Mock dependencies
jest.mock('node-fetch');

const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

describe('AntelopeAbisService', () => {
  let abisService: AntelopeAbisService;
  const config = {
    url: 'https://example.com',
    limit: 100,
    filter: 'eosio:setabi',
  };

  beforeEach(() => {
    // Reset mocks and create a new instance of AbisService
    jest.resetAllMocks();
    abisService = new AntelopeAbisService(config);
  });

  describe('fetchAbis', () => {
    it('should fetch ABIs for a contract', async () => {
      const contract = '0x123';
      const mockActions = [
        { block_num: 1, act: { data: { abi: 'ABI1' } } },
        { block_num: 2, act: { data: { abi: 'ABI2' } } },
      ];
      const expectedAbis = [
        ContractEncodedAbi.create(1, contract, 'ABI1'),
        ContractEncodedAbi.create(2, contract, 'ABI2'),
      ];

      mockFetch.mockResolvedValue({
        json: jest.fn().mockResolvedValue({ actions: mockActions }),
      } as any);

      const result = await abisService.fetchAbis(contract);

      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(mockFetch).toHaveBeenCalledWith(
        `${config.url}/v2/history/get_actions?account=${contract}&filter=${config.filter}&limit=${config.limit}&sort=-1`
      );
      expect(result).toEqual(expectedAbis);
    });

    it('should handle fetch errors and return an empty array', async () => {
      const contract = '0x123';

      mockFetch.mockRejectedValue(new Error('Fetch error'));

      const result = await abisService.fetchAbis(contract);

      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(result).toEqual([]);
    });
  });
});
