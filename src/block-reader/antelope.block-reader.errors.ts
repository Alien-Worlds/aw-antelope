/**
 * Error indicating that the "onReceivedBlock" handler should be set before calling readOneBlock or readBlocks methods.
 */
export class MissingHandlersError extends Error {
  constructor() {
    super('Set "onReceivedBlock" handler before calling readOneBlock/readBlocks');
  }
}

/**
 * Error indicating that the client is not connected, and the requestBlocks method cannot be called.
 */
export class ServiceNotConnectedError extends Error {
  constructor() {
    super(`Client is not connected, requestBlocks cannot be called`);
  }
}

/**
 * Error indicating that there was an error sending the block_range request with the specified start and end values.
 * The current request was not completed or canceled.
 */
export class UnhandledBlockRequestError extends Error {
  constructor(start: bigint, end: bigint) {
    super(
      `Error sending the block_range request ${start.toString()}-${end.toString()}. The current request was not completed or canceled.`
    );
  }
}

/**
 * Error indicating that an unhandled message type was received.
 * @param {string} type - The unhandled message type.
 */
export class UnhandledMessageTypeError extends Error {
  constructor(public readonly type: string) {
    super(`Unhandled message type: ${type}`);
  }
}

/**
 * Error indicating that a message was received while no block range is being processed.
 * @param {unknown} message - The received message.
 * @param {unknown} error - The associated error.
 */
export class UnhandledMessageError extends Error {
  constructor(public readonly message, public readonly error) {
    super('Received a message while no block range is being processed');
  }
}

/**
 * Error indicating that a SHiP Abi is not set.
 */
export class ShipAbiNotFoundError extends Error {
  constructor() {
    super(`Ship ABI not found`);
  }
}
