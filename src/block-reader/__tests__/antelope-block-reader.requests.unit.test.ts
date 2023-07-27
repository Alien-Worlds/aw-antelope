import { BlockReaderOptions } from '@alien-worlds/aw-core';
import { GetBlocksAckRequest, GetBlocksRequest } from '../antelope.block-reader.requests';

// Unit tests for GetBlocksRequest class
describe('GetBlocksRequest', () => {
  it('should create a GetBlocksRequest instance', () => {
    const startBlock = BigInt(100);
    const endBlock = BigInt(200);
    const options: BlockReaderOptions = {
      shouldFetchTraces: true,
      shouldFetchDeltas: false,
    };

    const request = GetBlocksRequest.create(startBlock, endBlock, options);

    expect(request.startBlock).toBe(startBlock);
    expect(request.endBlock).toBe(endBlock);
    expect(request.shouldFetchTraces).toBe(true);
    expect(request.shouldFetchDeltas).toBe(false);
  });

  it('should convert GetBlocksRequest instance to JSON', () => {
    const startBlock = BigInt(100);
    const endBlock = BigInt(200);
    const options: BlockReaderOptions = {
      shouldFetchTraces: true,
      shouldFetchDeltas: false,
    };

    const request = GetBlocksRequest.create(startBlock, endBlock, options);
    const json = request.toJSON();

    expect(json.type).toBe('request');
    expect(json.value[0]).toBe(`get_blocks_request_${request.version}`);
    expect(json.value[1].irreversible_only).toBe(false);
    expect(json.value[1].start_block_num).toBe(Number(startBlock.toString()));
    expect(json.value[1].end_block_num).toBe(Number(endBlock.toString()));
    expect(json.value[1].fetch_traces).toBe(true);
    expect(json.value[1].fetch_deltas).toBe(false);
  });
});

// Unit tests for GetBlocksAckRequest class
describe('GetBlocksAckRequest', () => {
  it('should create a GetBlocksAckRequest instance', () => {
    const messagesCount = 10;

    const request = new GetBlocksAckRequest(messagesCount);

    expect(request.messagesCount).toBe(messagesCount);
  });

  it('should convert GetBlocksAckRequest instance to JSON', () => {
    const messagesCount = 10;

    const request = new GetBlocksAckRequest(messagesCount);
    const json = request.toJSON();

    expect(json.type).toBe('request');
    expect(json.value[0]).toBe(`get_blocks_ack_request_${request.version}`);
    expect(json.value[1].num_messages).toBe(messagesCount);
  });
});
