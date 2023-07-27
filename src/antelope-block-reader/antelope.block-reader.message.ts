import { Block, BlockJsonModel } from '@alien-worlds/aw-core';
import { GetBlocksResultMessageContent } from './antelope.block-reader.types';
import { DefaultAbi } from './ship';

/**
 * Represents a message received from the blockchain.
 * @class
 * @template MessageContentType - The type of the message content.
 */
export class BlockReaderMessage<MessageContentType = GetBlocksResultMessageContent> {
  /**
   * The version of the block reader message.
   * @static
   * @type {string}
   */
  public static readonly version = 'v0';

  /**
   * Checks if the given data represents a pong message for get_blocks_result.
   * @private
   * @static
   * @param {GetBlocksResultMessageContent} data - The message content data.
   * @returns {boolean} - Whether it is a pong message or not.
   */
  private static isGetBlocksResultPongMessage(
    data: GetBlocksResultMessageContent
  ): boolean {
    return (
      typeof data.head === 'object' &&
      typeof data.last_irreversible === 'object' &&
      !data.prev_block &&
      !data.this_block &&
      !data.block &&
      !data.traces &&
      !data.deltas
    );
  }

  /**
   * Creates a BlockReaderMessage instance based on the received result and ABI.
   * @static
   * @param {Array} result - The result tuple [resultType, resultJson].
   * @param {Abi} abi - The ABI object.
   * @returns {BlockReaderMessage<Block> | null} - The created BlockReaderMessage instance, or null if creation fails.
   */
  public static create<MessageContentType = GetBlocksResultMessageContent>(
    result: [string, MessageContentType],
    abi: DefaultAbi
  ) {
    const [resultType, resultJson]: [string, MessageContentType] | [] = result || [];
    if (resultType) {
      if (resultType === `get_blocks_result_${this.version}`) {
        if (
          BlockReaderMessage.isGetBlocksResultPongMessage(
            <GetBlocksResultMessageContent>resultJson
          )
        ) {
          return new BlockReaderMessage<Block>(resultType, null, true);
        }

        (<BlockJsonModel>resultJson).abi_version = abi.version;
        return new BlockReaderMessage<Block>(
          resultType,
          Block.create(<BlockJsonModel>resultJson)
        );
      }
    }

    return null;
  }

  /**
   * Creates an instance of BlockReaderMessage.
   * @constructor
   * @param {string} type - The type of the message.
   * @param {MessageContentType} content - The content of the message.
   * @param {boolean} [isPongMessage=false] - Indicates if it is a pong message.
   */
  constructor(
    public readonly type: string,
    public readonly content: MessageContentType,
    public readonly isPongMessage = false
  ) {}
}
