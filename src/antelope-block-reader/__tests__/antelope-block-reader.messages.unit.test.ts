import { Block } from '@alien-worlds/aw-core';
import { BlockReaderMessage } from '../antelope.block-reader.message';

describe('BlockReaderMessage', () => {
  const abi = { version: '1.0' };

  describe('create', () => {
    it('should return null for an empty result', () => {
      const result = BlockReaderMessage.create(null, abi);
      expect(result).toBeNull();
    });

    it('should return null for an unknown result type', () => {
      const result = BlockReaderMessage.create(['unknown_type', {}], abi);
      expect(result).toBeNull();
    });

    it('should create a BlockReaderMessage for get_blocks_result_v0 type with Block content', () => {
      const result = BlockReaderMessage.create(
        [
          'get_blocks_result_v0',
          {
            block_id: 'blockId',
            last_irreversible: { block_num: 100, block_id: 100 },
            head: { block_num: 2000, block_id: 2000 },
            prev_block: { block_num: 110, block_id: 111 },
            this_block: { block_num: 111, block_id: 112 },
          },
        ],
        abi
      );
      expect(result).toBeInstanceOf(BlockReaderMessage);
      expect(result.type).toBe('get_blocks_result_v0');
      expect(result.content).toBeInstanceOf(Block);
    });

    it('should create a BlockReaderMessage for get_blocks_result_v0 type with null content (pong message)', () => {
      const result = BlockReaderMessage.create(
        ['get_blocks_result_v0', { head: {}, last_irreversible: {} }],
        abi
      );
      expect(result).toBeInstanceOf(BlockReaderMessage);
      expect(result.type).toBe('get_blocks_result_v0');
      expect(result.content).toBeNull();
      expect(result.isPongMessage).toBe(true);
    });
  });
});
