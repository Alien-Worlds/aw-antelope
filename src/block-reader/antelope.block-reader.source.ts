import WebSocket from 'ws';
import { BlockReaderConnectionState } from './antelope.block-reader.enums';
import { ConnectionChangeHandler } from './antelope.block-reader.types';
import { BlockReaderConfig, log } from '@alien-worlds/aw-core';

/**
 * Class representing a Block Reader source.
 */
export class AntelopeBlockReaderSource {
  private messageHandler: (...args: unknown[]) => void;
  private errorHandler: (...args: unknown[]) => void;
  private client: WebSocket;
  private endpoint: string;
  private connectionState = BlockReaderConnectionState.Idle;
  private connectionChangeHandlers: Map<
    BlockReaderConnectionState,
    ConnectionChangeHandler
  > = new Map();
  private socketIndex = -1;
  private reconnectDelay;

  /**
   * Creates an instance of BlockReaderSource.
   * @param {BlockReaderConfig} config - The configuration for the Block Reader source.
   */
  constructor(private readonly config: BlockReaderConfig) {}

  /**
   * Private method that updates the connection state.
   * @param {BlockReaderConnectionState} state - The new connection state.
   * @param {string} [data] - Additional data associated with the state change.
   * @private
   */
  private async updateConnectionState(state: BlockReaderConnectionState, data?: string) {
    const previousState = this.connectionState;
    this.connectionState = state;
    this.reconnectDelay = this.config.reconnectInterval || 1000;
    const handler = this.connectionChangeHandlers.get(state);
    if (handler) {
      return handler({ previousState, state, data });
    }
  }

  /**
   * Private method that retrieves the next endpoint to connect to.
   * @returns {string} The next endpoint.
   * @private
   */
  private getNextEndpoint() {
    let nextIndex = ++this.socketIndex;

    if (nextIndex >= this.config.endpoints.length) {
      nextIndex = 0;
    }
    this.socketIndex = nextIndex;

    return this.config.endpoints[this.socketIndex];
  }

  /**
   * Private method that waits until the connection is open.
   * @returns {Promise<boolean>} A promise that resolves when the connection is open.
   * @private
   */
  private waitUntilConnectionIsOpen() {
    log(`BlockReader plugin connecting to: ${this.endpoint}`);
    return new Promise(resolve => {
      this.client.once('open', () => {
        log(`BlockReader plugin connection open.`);
        resolve(true);
      });
    });
  }

  /**
   * Private method that handles the error when the connection is closed.
   * @param {number} code - The close code.
   * @private
   */
  private async onConnectionClosed(code: number) {
    this.client = null;
    log(`BlockReader plugin connection closed with code #${code}.`);
    await this.updateConnectionState(BlockReaderConnectionState.Idle);
  }

  /**
   * Private method that receives the ABI from the Block Reader source.
   * @returns {Promise<string>} A promise that resolves to the received ABI.
   * @private
   */
  private receiveAbi() {
    return new Promise<string>(resolve => this.client.once('message', resolve));
  }

  /**
   * Sets the error handler for the Block Reader source.
   * @param {(error: Error) => void} handler - The error handler function.
   */
  public onError(handler: (error: Error) => void) {
    this.errorHandler = handler;
  }

  /**
   * Sets the message handler for the Block Reader source.
   * @param {(dto: Uint8Array) => void} handler - The message handler function.
   */
  public onMessage(handler: (dto: Uint8Array) => void) {
    this.messageHandler = handler;
  }

  /**
   * Adds a connection state change handler for the specified state.
   * @param {BlockReaderConnectionState} state - The connection state.
   * @param {ConnectionChangeHandler} handler - The handler function for the state change.
   */
  public addConnectionStateHandler(
    state: BlockReaderConnectionState,
    handler: ConnectionChangeHandler
  ) {
    if (this.connectionChangeHandlers.has(state)) {
      console.warn(`Overriding the handler assigned to the "${state}" state`);
    } else {
      this.connectionChangeHandlers.set(state, handler);
    }
  }

  /**
   * Gets the connection status of the Block Reader source.
   * @returns {boolean} The connection status.
   */
  public get isConnected() {
    return this.connectionState === BlockReaderConnectionState.Connected;
  }

  /**
   * Connects to the Block Reader source.
   * @returns {Promise<void>} A promise that resolves when the connection is established.
   */
  public async connect() {
    if (this.connectionState === BlockReaderConnectionState.Idle) {
      log(`BlockReader plugin connecting...`);
      try {
        await this.updateConnectionState(BlockReaderConnectionState.Connecting);
        this.endpoint = this.getNextEndpoint();
        this.client = new WebSocket(this.endpoint, {
          perMessageDeflate: false,
        });
        this.client.on('close', code => this.onConnectionClosed(code));
        this.client.on('error', error => this.errorHandler(error));
        await this.waitUntilConnectionIsOpen();
        // receive ABI - first message from WS is always ABI
        const abi = await this.receiveAbi();
        // set message handler
        this.client.on('message', message => this.messageHandler(message));

        await this.updateConnectionState(BlockReaderConnectionState.Connected, abi);
      } catch (error) {
        console.log(error);
        setTimeout(
          () => this.updateConnectionState(BlockReaderConnectionState.Idle),
          this.reconnectDelay
        );
        this.connectionState = BlockReaderConnectionState.Idle;
        this.errorHandler(error);
      }
    }
  }

  /**
   * Disconnects from the Block Reader source.
   * @returns {Promise<void>} A promise that resolves when the connection is closed.
   */
  public async disconnect() {
    if (this.connectionState === BlockReaderConnectionState.Connected) {
      log(`BlockReader plugin disconnecting...`);
      try {
        await this.updateConnectionState(BlockReaderConnectionState.Disconnecting);
        this.client.removeAllListeners();
        this.client.close();
      } catch (error) {
        this.errorHandler(error);
      }
    }
  }

  /**
   * Sends a message to the Block Reader source.
   * @param {Uint8Array} message - The message to send.
   */
  public send(message: Uint8Array) {
    this.client.send(message);
  }
}
