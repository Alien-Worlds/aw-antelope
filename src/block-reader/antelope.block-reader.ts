/* eslint-disable @typescript-eslint/restrict-template-expressions */
import {
  Block,
  BlockReader,
  BlockReaderOptions,
  Serializer,
  UnknownObject,
  log,
} from '@alien-worlds/aw-core';
import { BlockReaderConnectionState } from './antelope.block-reader.enums';
import {
  MissingHandlersError,
  ShipAbiNotFoundError,
  UnhandledMessageError,
  UnhandledMessageTypeError,
} from './antelope.block-reader.errors';
import { AntelopeBlockReaderSource } from './antelope.block-reader.source';
import { ConnectionChangeHandlerOptions } from './antelope.block-reader.types';
import { BlockReaderMessage } from './antelope.block-reader.message';
import { GetBlocksAckRequest, GetBlocksRequest } from './antelope.block-reader.requests';
import { DefaultAbi, ShipAbiRepository } from './ship';

/**
 * BlockReader is responsible for managing the connection to a block reader service and handling block retrieval.
 */
export class AntelopeBlockReader<Abi = UnknownObject> extends BlockReader {
  private _blockRangeRequest: GetBlocksRequest;
  private _abi: Abi;
  private _abiTypes: Map<string, unknown>;
  private _paused = false;
  private isLastBlock = false;
  /**
   * Creates an instance of BlockReader.
   * @param {AntelopeBlockReaderSource} source - The BlockReaderSource instance for handling the WebSocket connection.
   * @param {ShipAbiRepository} shipAbis - The ShipAbiRepository instance for managing ABIs.
   * @param {Serializer} serializer - The BlockReaderSerializer instance for serializing and deserializing messages.
   */
  constructor(
    private source: AntelopeBlockReaderSource,
    private shipAbis: ShipAbiRepository,
    private serializer: Serializer
  ) {
    super();
    this.source.onMessage(message => this.onMessage(message));
    this.source.onError(error => {
      this.handleError(error);
    });
    this.source.addConnectionStateHandler(BlockReaderConnectionState.Connected, options =>
      this.onConnected(options)
    );
    this.source.addConnectionStateHandler(BlockReaderConnectionState.Idle, options =>
      this.onDisconnected(options)
    );
  }

  /**
   * Private method called when the BlockReaderSource is connected.
   * @private
   * @param {ConnectionChangeHandlerOptions} options - The options containing data related to the connection change.
   * @returns {Promise<void>} A promise that resolves once the handling is complete.
   */
  private async onConnected({ data }: ConnectionChangeHandlerOptions) {
    log(`BlockReader plugin connected`);
    const { _blockRangeRequest } = this;

    const abi = JSON.parse(data);
    if (abi) {
      const result = await this.shipAbis.getAbi(abi.version);

      if (result.isFailure) {
        await this.shipAbis.updateAbi(abi.version, abi);
      }

      this._abiTypes = this.serializer.getTypesFromAbi(abi);
      this._abi = abi;

      if (_blockRangeRequest) {
        // resume previously unfinished request
        const { startBlock, endBlock, shouldFetchDeltas, shouldFetchTraces } =
          _blockRangeRequest;
        this.sendRequest(startBlock, endBlock, { shouldFetchDeltas, shouldFetchTraces });
      }
    }
  }

  /**
   * Private method called when the BlockReaderSource is disconnected.
   * @private
   * @param {ConnectionChangeHandlerOptions} options - The options containing data related to the connection change.
   */
  private onDisconnected({ previousState }: ConnectionChangeHandlerOptions) {
    log(`BlockReader plugin disconnected`);
    if (previousState === BlockReaderConnectionState.Disconnecting) {
      this._abi = null;
    }
    this.connect();
  }

  /**
   * Returns the ABI associated with the BlockReader.
   */
  public get abi(): Abi {
    return this._abi;
  }

  /**
   * Registers a message handler to handle incoming messages from the BlockReaderSource.
   * @param {Uint8Array} dto - The Uint8Array message received from the BlockReaderSource.
   * @returns {Promise<void>} A promise that resolves once the message is handled.
   */
  public onMessage(dto: Uint8Array): Promise<void> {
    const { abi } = this;

    if (!abi) {
      this.handleError(new ShipAbiNotFoundError());
      return;
    }

    const result = this.serializer.deserialize(dto, 'result', this._abiTypes);
    const message = BlockReaderMessage.create(result, abi as DefaultAbi);
    if (message && message.isPongMessage === false) {
      this.handleBlocksResultContent(message.content);
    } else if (!message) {
      this.handleError(new UnhandledMessageTypeError(message.type));
    }
  }

  /**
   * Private method to handle the content of blocks received from the BlockReaderSource.
   * @private
   * @param {Block} result - The received block content.
   */
  private async handleBlocksResultContent(result: Block) {
    const { thisBlock } = result;
    const { abi, _abiTypes } = this;

    // skip any extra result messages
    if (this.isLastBlock) {
      return;
    }

    if (!abi) {
      this.handleError(new ShipAbiNotFoundError());
      return;
    }

    try {
      if (thisBlock) {
        const {
          _blockRangeRequest: { startBlock, endBlock },
        } = this;
        this.isLastBlock = thisBlock.blockNumber === endBlock - 1n;

        if (this.isLastBlock) {
          await this.receivedBlockHandler(result);
          this.blockRangeCompleteHandler(startBlock, endBlock);
          this._blockRangeRequest = null;
        } else {
          this.receivedBlockHandler(result);
          // State history plugs will answer every call of ack_request, even after
          // processing the full range, it will send messages containing only head.
          // After the block has been processed, the connection should be closed so
          // there is no need to ack request.
          if (this.source.isConnected && this._paused === false) {
            // Acknowledge a request so that source can send next one.
            const { type, value } = new GetBlocksAckRequest(1).toJSON();
            this.source.send(this.serializer.serialize(value, type, _abiTypes));
          }
        }
      } else {
        this.handleWarning(`the received message does not contain this_block`);
      }
    } catch (error) {
      console.log(error);
      this.handleError(new UnhandledMessageError(result, error));
    }
  }

  /**
   * Private method to handle errors.
   * @private
   * @param {Error} error - The error object.
   */
  private handleError(error: Error) {
    if (this.errorHandler) {
      return this.errorHandler(error);
    }
  }

  /**
   * Private method to handle warnings.
   * @private
   * @param {...unknown} args - Arguments passed to the warning handler.
   */
  private handleWarning(...args: unknown[]) {
    if (this.warningHandler) {
      return this.warningHandler(...args);
    }
  }

  /**
   * Establishes a connection to the block reader service.
   * @returns {Promise<void>} A promise that resolves once the connection is established.
   */
  public async connect(): Promise<void> {
    if (this.source.isConnected === false) {
      await this.source.connect();
    } else {
      log(`Service already connected`);
    }
  }

  /**
   * Closes the connection to the block reader service.
   * @returns {Promise<void>} A promise that resolves once the connection is closed.
   */
  public async disconnect(): Promise<void> {
    if (this.source.isConnected) {
      await this.source.disconnect();
    } else {
      log(`Service not connected`);
    }
  }

  /**
   * Pauses block retrieval. The BlockReader will stop sending requests for blocks.
   */
  public pause(): void {
    if (this._paused === false) {
      this._paused = true;
    }
  }

  /**
   * Resumes block retrieval. The BlockReader will continue sending requests for blocks.
   */
  public resume(): void {
    if (this._paused && !this.isLastBlock) {
      this._paused = false;
      const { type, value } = new GetBlocksAckRequest(1).toJSON();
      this.source.send(this.serializer.serialize(value, type, this._abiTypes));
    }
  }

  /**
   * Reads a range of blocks from the block reader service.
   * @param {bigint} startBlock - The starting block number.
   * @param {bigint} endBlock - The ending block number (exclusive).
   * @param {BlockReaderOptions} [options] - Additional options for block retrieval.
   */
  public readBlocks(
    startBlock: bigint,
    endBlock: bigint,
    options?: BlockReaderOptions
  ): void {
    this.sendRequest(startBlock, endBlock, options);
    log(`BlockReader plugin: read blocks`, { startBlock, endBlock });
  }

  /**
   * Reads a single block from the block reader service.
   * @param {bigint} block - The block number to retrieve.
   * @param {BlockReaderOptions} [options] - Additional options for block retrieval.
   */
  public readOneBlock(block: bigint, options?: BlockReaderOptions): void {
    this.sendRequest(block, block + 1n, options);
    log(`BlockReader plugin: read single block ${block}`);
  }

  /**
   * Private method to send a request for block retrieval to the BlockReaderSource.
   * @private
   * @param {bigint} startBlock - The starting block number.
   * @param {bigint} endBlock - The ending block number (exclusive).
   * @param {BlockReaderOptions} [options] - Additional options for block retrieval.
   */
  private sendRequest(
    startBlock: bigint,
    endBlock: bigint,
    options?: BlockReaderOptions
  ): void {
    const requestOptions = options || {
      shouldFetchDeltas: true,
      shouldFetchTraces: true,
    };

    this.isLastBlock = false;
    this.resume();

    const { abi, receivedBlockHandler, source } = this;
    if (!receivedBlockHandler) {
      throw new MissingHandlersError();
    }

    if (!abi) {
      throw new ShipAbiNotFoundError();
    }

    this._blockRangeRequest = GetBlocksRequest.create(
      startBlock,
      endBlock,
      requestOptions
    );
    const { type, value } = this._blockRangeRequest.toJSON();
    source.send(this.serializer.serialize(value, type, this._abiTypes));
  }
}
