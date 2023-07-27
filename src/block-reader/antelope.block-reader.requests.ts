import { BlockReaderOptions } from '@alien-worlds/aw-core';
import { BlocReaderRequestJson } from './antelope.block-reader.types';

/**
 * GetBlocksRequest represents a request to fetch blocks from a specific range of block numbers.
 * @class
 */
export class GetBlocksRequest {
  public readonly version = 'v0';

  /**
   * Create a new GetBlocksRequest instance.
   * @param {bigint} startBlock - The starting block number.
   * @param {bigint} endBlock - The ending block number.
   * @param {BlockReaderOptions} options - The options for fetching blocks.
   * @returns {GetBlocksRequest} A new GetBlocksRequest instance.
   */
  public static create(
    startBlock: bigint,
    endBlock: bigint,
    options: BlockReaderOptions
  ) {
    const { shouldFetchDeltas, shouldFetchTraces } = options;

    return new GetBlocksRequest(
      startBlock,
      endBlock,
      shouldFetchTraces,
      shouldFetchDeltas
    );
  }
  /**
   *
   * @param startBlock
   * @param endBlock
   * @param shouldFetchTraces
   * @param shouldFetchDeltas
   */
  constructor(
    public readonly startBlock: bigint,
    public readonly endBlock: bigint,
    public readonly shouldFetchTraces: boolean,
    public readonly shouldFetchDeltas: boolean
  ) {}

  /**
   * Convert the GetBlocksRequest instance to a JSON representation.
   * @returns {BlocReaderRequestJson} The JSON representation of the GetBlocksRequest.
   */
  public toJSON(): BlocReaderRequestJson {
    return {
      type: 'request',
      value: [
        `get_blocks_request_${this.version}`,
        {
          irreversible_only: false,
          start_block_num: Number(this.startBlock.toString()),
          end_block_num: Number(this.endBlock.toString()),
          max_messages_in_flight: 1,
          have_positions: [],
          fetch_block: true,
          fetch_traces: this.shouldFetchTraces,
          fetch_deltas: this.shouldFetchDeltas,
        },
      ],
    };
  }
}

/**
 * GetBlocksAckRequest represents a request to acknowledge the number of messages received.
 * @class
 */
export class GetBlocksAckRequest {
  public readonly version = 'v0';

  /**
   * Create a new GetBlocksAckRequest instance.
   * @param {number} messagesCount - The number of messages received.
   * @returns {GetBlocksAckRequest} A new GetBlocksAckRequest instance.
   */
  constructor(public readonly messagesCount: number) {}

  /**
   * Convert the GetBlocksAckRequest instance to a JSON representation.
   * @returns {BlocReaderRequestJson} The JSON representation of the GetBlocksAckRequest.
   */
  public toJSON(): BlocReaderRequestJson {
    return {
      type: 'request',
      value: [
        `get_blocks_ack_request_${this.version}`,
        { num_messages: this.messagesCount },
      ],
    };
  }
}
