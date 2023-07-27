import WebSocket from 'ws';
import { AntelopeBlockReaderSource } from '../antelope.block-reader.source';
import { ConnectionChangeHandler } from '../antelope.block-reader.types';
import { BlockReaderConnectionState } from '../antelope.block-reader.enums';
import { BlockReaderConfig } from '@alien-worlds/aw-core';

jest.mock('ws', () => {
  class MockWebSocket {
    url = 'ws://mockendpoint';
    public on = jest.fn();
    public once = jest.fn();
    public removeAllListeners = jest.fn();
    public onopen: (() => void) | null = null;
    public onmessage: ((event: { data: string }) => void) | null = null;
    public onclose: (() => void) | null = null;

    public send(data: Uint8Array | string): void {
      if (this.onmessage) {
        this.onmessage({ data: 'Received: ' + data.toString() });
      }
    }

    public close(): void {
      if (this.onclose) {
        this.onclose();
      }
    }

    public triggerOpen(): void {
      if (this.onopen) {
        this.onopen();
      }
    }
  }

  return MockWebSocket;
});

describe('BlockReaderSource', () => {
  let blockReaderSource: AntelopeBlockReaderSource;
  let mockWebSocket: any;
  const mockEndpoint = 'ws://mockendpoint';
  const mockAbi = 'mockabi';
  const mockConfig: BlockReaderConfig = {
    endpoints: [mockEndpoint],
    reconnectInterval: 1000,
  };

  beforeEach(() => {
    mockWebSocket = new WebSocket(); // Create an instance of the mocked WebSocket
    blockReaderSource = new AntelopeBlockReaderSource(mockConfig);
    (blockReaderSource as any).client = mockWebSocket;
    (blockReaderSource as any).endpoint = mockEndpoint;
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('send', () => {
    it('should send the message via the WebSocket connection', () => {
      const mockMessage = new Uint8Array([1, 2, 3]);
      const sendSpy = jest.spyOn(mockWebSocket, 'send');
      // const onMessageSpy = jest.spyOn(mockWebSocket, 'onmessage');

      blockReaderSource.send(mockMessage);

      expect(sendSpy).toHaveBeenCalledWith(mockMessage);
      // expect(onMessageSpy).toHaveBeenCalled();
    });
  });

  describe('onError', () => {
    const mockErrorHandler = jest.fn();

    beforeEach(() => {
      blockReaderSource.onError(mockErrorHandler);
    });

    it('should set the error handler', () => {
      expect((blockReaderSource as any).errorHandler).toEqual(mockErrorHandler);
    });
  });

  describe('onMessage', () => {
    const mockMessageHandler = jest.fn();

    beforeEach(() => {
      blockReaderSource.onMessage(mockMessageHandler);
    });

    it('should set the message handler', () => {
      expect((blockReaderSource as any).messageHandler).toEqual(mockMessageHandler);
    });
  });

  describe('addConnectionStateHandler', () => {
    const mockConnectionChangeHandler: ConnectionChangeHandler = jest.fn();

    beforeEach(() => {
      blockReaderSource.addConnectionStateHandler(
        BlockReaderConnectionState.Connecting,
        mockConnectionChangeHandler
      );
    });

    it('should add the connection state change handler', () => {
      const connectionChangeHandlers = (blockReaderSource as any)
        .connectionChangeHandlers;
      expect(connectionChangeHandlers.get(BlockReaderConnectionState.Connecting)).toEqual(
        mockConnectionChangeHandler
      );
    });

    it('should override the handler if already assigned to the same state', () => {
      blockReaderSource.addConnectionStateHandler(
        BlockReaderConnectionState.Connecting,
        jest.fn()
      );
      const connectionChangeHandlers = (blockReaderSource as any)
        .connectionChangeHandlers;
      expect(connectionChangeHandlers.get(BlockReaderConnectionState.Connecting)).toEqual(
        mockConnectionChangeHandler
      );
    });

    it('should log a warning if trying to override an existing handler', () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn');
      blockReaderSource.addConnectionStateHandler(
        BlockReaderConnectionState.Connecting,
        jest.fn()
      );
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'Overriding the handler assigned to the "connecting" state'
      );
    });
  });

  describe('isConnected', () => {
    it('should return true if the connection state is connected', () => {
      (blockReaderSource as any).connectionState = BlockReaderConnectionState.Connected;
      expect(blockReaderSource.isConnected).toBe(true);
    });

    it('should return false if the connection state is not connected', () => {
      (blockReaderSource as any).connectionState = BlockReaderConnectionState.Idle;
      expect(blockReaderSource.isConnected).toBe(false);
    });
  });

  describe('connect', () => {
    beforeEach(() => {
      (blockReaderSource as any).updateConnectionState = jest.fn();
      (blockReaderSource as any).connectionState = BlockReaderConnectionState.Idle;
      (blockReaderSource as any).waitUntilConnectionIsOpen = jest.fn();
      (blockReaderSource as any).getNextEndpoint = jest
        .fn()
        .mockReturnValue(mockEndpoint);
      (blockReaderSource as any).receiveAbi = jest.fn().mockResolvedValue(mockAbi);
      (blockReaderSource as any).messageHandler = jest.fn();
      (blockReaderSource as any).errorHandler = jest.fn();
    });

    it('should update the connection state to connecting', async () => {
      await blockReaderSource.connect();
      expect((blockReaderSource as any).updateConnectionState).toHaveBeenCalledWith(
        BlockReaderConnectionState.Connecting
      );
    });

    it('should set the endpoint with the next endpoint', async () => {
      await blockReaderSource.connect();
      expect((blockReaderSource as any).endpoint).toEqual(mockEndpoint);
    });

    it('should create a new WebSocket connection', async () => {
      await blockReaderSource.connect();
      expect((blockReaderSource as any).client).toBeInstanceOf(WebSocket);
      expect((blockReaderSource as any).client.url).toEqual(mockEndpoint);
    });

    it('should wait until the connection is open', async () => {
      await blockReaderSource.connect();
      expect((blockReaderSource as any).waitUntilConnectionIsOpen).toHaveBeenCalled();
    });

    it('should receive the ABI from the WebSocket connection', async () => {
      await blockReaderSource.connect();
      expect((blockReaderSource as any).receiveAbi).toHaveBeenCalled();
    });

    it('should update the connection state to connected', async () => {
      await blockReaderSource.connect();
      expect((blockReaderSource as any).updateConnectionState).toHaveBeenCalledWith(
        BlockReaderConnectionState.Connected,
        mockAbi
      );
    });

    it('should handle errors and update the connection state to idle', async () => {
      const mockErrorHandler = jest.fn();
      blockReaderSource.onError(mockErrorHandler);
      (blockReaderSource as any).waitUntilConnectionIsOpen.mockRejectedValue(
        new Error('Connection error')
      );
      await blockReaderSource.connect();
      expect((blockReaderSource as any).updateConnectionState).toHaveBeenCalledWith(
        BlockReaderConnectionState.Connecting
      );
      expect(mockErrorHandler).toHaveBeenCalledWith(new Error('Connection error'));
    });
  });

  describe('disconnect', () => {
    beforeEach(() => {
      (blockReaderSource as any).connectionState = BlockReaderConnectionState.Connected;
      (blockReaderSource as any).updateConnectionState = jest.fn();
      (blockReaderSource as any).client.close = jest.fn();
      (blockReaderSource as any).errorHandler = jest.fn();
    });

    it('should update the connection state to disconnecting', async () => {
      await blockReaderSource.disconnect();
      expect((blockReaderSource as any).updateConnectionState).toHaveBeenCalledWith(
        BlockReaderConnectionState.Disconnecting
      );
    });

    it('should close the WebSocket connection', async () => {
      await blockReaderSource.disconnect();
      expect((blockReaderSource as any).client.close).toHaveBeenCalled();
    });

    it('should handle errors', async () => {
      const mockErrorHandler = jest.fn();
      blockReaderSource.onError(mockErrorHandler);
      jest
        .spyOn(blockReaderSource as any, 'updateConnectionState')
        .mockImplementation(() => {});
      (blockReaderSource as any).client.close = jest.fn(() => {
        throw new Error('Close error');
      });
      await blockReaderSource.disconnect();
      expect(mockErrorHandler).toHaveBeenCalledWith(new Error('Close error'));
    });
  });

  describe('updateConnectionState', () => {
    it('should update the connection state and call the handler if present', async () => {
      (blockReaderSource as any).connectionState = BlockReaderConnectionState.Idle;
      const mockHandler = jest.fn();
      (blockReaderSource as any).connectionChangeHandlers.set(
        BlockReaderConnectionState.Connecting,
        mockHandler
      );

      await (blockReaderSource as any).updateConnectionState(
        BlockReaderConnectionState.Connecting,
        mockAbi
      );

      expect((blockReaderSource as any).connectionState).toEqual(
        BlockReaderConnectionState.Connecting
      );
      expect(mockHandler).toHaveBeenCalledWith({
        previousState: BlockReaderConnectionState.Idle,
        state: BlockReaderConnectionState.Connecting,
        data: mockAbi,
      });
    });

    it('should update the connection state and not call the handler if not present', async () => {
      await (blockReaderSource as any).updateConnectionState(
        BlockReaderConnectionState.Connected,
        mockAbi
      );

      expect((blockReaderSource as any).connectionState).toEqual(
        BlockReaderConnectionState.Connected
      );
    });
  });

  describe('getNextEndpoint', () => {
    it('should return the next endpoint in the configuration', () => {
      const nextIndex = (blockReaderSource as any).socketIndex + 1;
      const nextEndpoint = mockConfig.endpoints[nextIndex % mockConfig.endpoints.length];
      const endpoint = (blockReaderSource as any).getNextEndpoint();

      expect(endpoint).toEqual(nextEndpoint);
    });
  });

  describe('waitUntilConnectionIsOpen', () => {
    it('should resolve the promise when the connection is open', done => {
      const openHandler = jest.fn();
      const clientOnceSpy = jest
        .spyOn(mockWebSocket, 'once')
        .mockImplementation((event, callback: Function) => {
          if (event === 'open') {
            openHandler();
            callback();
          }
        });

      const promise = (blockReaderSource as any).waitUntilConnectionIsOpen();

      expect(clientOnceSpy).toHaveBeenCalledWith('open', expect.any(Function));

      promise.then(result => {
        expect(result).toBe(true);
        expect(openHandler).toHaveBeenCalled();
        done();
      });
    });
  });

  describe('onConnectionClosed', () => {
    it('should reset the client and update the connection state to idle', async () => {
      (blockReaderSource as any).updateConnectionState = jest.fn();

      await (blockReaderSource as any).onConnectionClosed(1000);

      expect((blockReaderSource as any).client).toBeNull();
      expect((blockReaderSource as any).updateConnectionState).toHaveBeenCalledWith(
        BlockReaderConnectionState.Idle
      );
    });
  });

  describe('receiveAbi', () => {
    it('should resolve the promise with the received ABI', done => {
      const messageHandler = jest.fn();
      const clientOnceSpy = jest
        .spyOn(mockWebSocket, 'once')
        .mockImplementation((event, callback: Function) => {
          if (event === 'message') {
            messageHandler();
            callback(mockAbi);
          }
        });

      const promise = (blockReaderSource as any).receiveAbi();

      expect(clientOnceSpy).toHaveBeenCalledWith('message', expect.any(Function));

      promise.then(result => {
        expect(result).toBe(mockAbi);
        expect(messageHandler).toHaveBeenCalled();
        done();
      });
    });
  });
});
