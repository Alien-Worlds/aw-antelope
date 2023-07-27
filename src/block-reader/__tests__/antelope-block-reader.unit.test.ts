import { Block, Failure, Result, Serializer } from '@alien-worlds/aw-core';
import { AntelopeBlockReader } from '../antelope.block-reader';
import { AntelopeBlockReaderSource } from '../antelope.block-reader.source';
import { GetBlocksRequest } from '../antelope.block-reader.requests';
import { BlockReaderConnectionState } from '../antelope.block-reader.enums';
import { ShipAbiRepository } from '../ship';

describe('BlockReader', () => {
  let blockReader: AntelopeBlockReader;
  let mockSource: AntelopeBlockReaderSource;
  let mockShipAbis: ShipAbiRepository;
  let mockSerializer: Serializer;

  const mockAbiData = {
    abiExtensions: [],
    actions: [],
    errorMessages: [],
    ricardianClauses: [],
    structs: [],
    tables: [],
    types: [],
    variants: [],
    version: '1.0',
  };

  beforeEach(() => {
    mockSource = new AntelopeBlockReaderSource({} as any);
    mockShipAbis = { updateAbi: jest.fn(), getAbi: jest.fn() };
    mockSerializer = {
      serialize: jest.fn(),
      deserialize: jest.fn(),
      getTypesFromAbi: jest.fn(() => new Map()),
      getHexFromAbi: jest.fn(() => ''),
    } as any;
    blockReader = new AntelopeBlockReader(mockSource, mockShipAbis, mockSerializer);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('onConnected', () => {
    beforeEach(() => {
      jest
        .spyOn(mockShipAbis, 'getAbi')
        .mockReturnValue(Result.withFailure(Failure.withMessage('Error')) as any);
    });

    it('should set the ABI if it exists in the ShipAbiRepository', async () => {
      await (blockReader as any).onConnected({ data: JSON.stringify(mockAbiData) });
      expect((blockReader as any).abi).toEqual(mockAbiData);
    });

    it('should update the ABI in the ShipAbiRepository if it does not exist', async () => {
      jest.spyOn(mockShipAbis, 'updateAbi').mockReturnValue(Promise.resolve({} as any));
      await (blockReader as any).onConnected({ data: JSON.stringify(mockAbiData) });
      expect(mockShipAbis.updateAbi).toHaveBeenCalledWith('1.0', mockAbiData);
      expect((blockReader as any).abi).toEqual(mockAbiData);
    });
  });

  describe('onDisconnected', () => {
    beforeEach(() => {
      jest.spyOn(blockReader as any, 'connect').mockImplementation(() => {});
    });

    it('should log a message when the BlockReaderSource is disconnected', () => {
      const consoleLogSpy = jest.spyOn(console, 'log');
      (blockReader as any).onDisconnected({
        previousState: BlockReaderConnectionState.Disconnecting,
      });
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should clear the ABI when the previous state is Disconnecting', () => {
      (blockReader as any)._abi = { version: '1.0', typesMap: {} };
      (blockReader as any).onDisconnected({
        previousState: BlockReaderConnectionState.Disconnecting,
      });
      expect((blockReader as any).abi).toBeNull();
    });

    it('should call the connect method when the previous state is Idle', () => {
      (blockReader as any).onDisconnected({
        previousState: BlockReaderConnectionState.Idle,
      });
      expect(blockReader.connect).toHaveBeenCalled();
    });
  });

  describe('onMessage', () => {
    const mockDto = new Uint8Array();

    beforeEach(() => {
      jest.spyOn(blockReader as any, 'handleError').mockImplementation(() => {});
      jest.spyOn(blockReader as any, 'handleWarning').mockImplementation(() => {});
      jest
        .spyOn(blockReader as any, 'handleBlocksResultContent')
        .mockImplementation(() => {});
    });

    it('should handle the message and call handleBlocksResultContent if the message is not a PongMessage', async () => {
      const mockMessage = [
        'get_blocks_result_v0',
        {
          block_id: 'blockId',
          last_irreversible: { block_num: 100, block_id: 100 },
          head: { block_num: 2000, block_id: 2000 },
          prev_block: { block_num: 110, block_id: 111 },
          this_block: { block_num: 111, block_id: 112 },
        },
      ] as any;
      jest.spyOn(mockSerializer, 'deserialize').mockReturnValue(mockMessage);
      jest.spyOn(blockReader as any, 'abi', 'get').mockReturnValue({});
      await blockReader.onMessage(mockDto);
      expect((blockReader as any).handleBlocksResultContent).toHaveBeenCalledWith({
        abiVersion: undefined,
        block: undefined,
        deltas: undefined,
        head: { blockId: 2000, blockNumber: 2000n },
        id: undefined,
        lastIrreversible: { blockId: 100, blockNumber: 100n },
        prevBlock: { blockId: 111, blockNumber: 110n },
        thisBlock: { blockId: 112, blockNumber: 111n },
        traces: undefined,
      });
    });

    it('should handle the error if the message is null', async () => {
      jest.spyOn(mockSerializer, 'deserialize').mockReturnValue(null);
      await blockReader.onMessage(mockDto);
      expect((blockReader as any).handleError).toHaveBeenCalled();
    });

    it('should handle the error if the ABI does not exist', async () => {
      jest.spyOn(mockSerializer, 'deserialize').mockReturnValue({} as any);
      jest.spyOn(blockReader as any, 'abi', 'get').mockReturnValue(null);
      await blockReader.onMessage(mockDto);
      expect((blockReader as any).handleError).toHaveBeenCalled();
    });

    it('should handle the warning if the message is a PongMessage', async () => {
      const mockMessage = [
        'get_blocks_result_v0',
        {
          block_id: 'blockId',
          last_irreversible: { block_num: 100, block_id: 100 },
          head: { block_num: 2000, block_id: 2000 },
        },
      ] as any;
      jest.spyOn(mockSerializer, 'deserialize').mockReturnValue(mockMessage);
      jest.spyOn(blockReader as any, 'abi', 'get').mockReturnValue({});
      await blockReader.onMessage(mockDto);
      expect((blockReader as any).handleBlocksResultContent).not.toHaveBeenCalled();
      expect((blockReader as any).handleError).not.toHaveBeenCalled();
    });
  });

  describe('handleBlocksResultContent', () => {
    const mockBlock = { thisBlock: { blockNumber: 1n } };
    const mockResult = Block.create({
      head: { block_id: '1', block_num: '12' },
      last_irreversible: { block_id: '1', block_num: '12' },
      prev_block: { block_id: '1', block_num: '12' },
      this_block: { block_id: '1', block_num: '12' },
    });
    const mockAbi = { typesMap: {} };

    beforeEach(() => {
      (blockReader as any)._blockRangeRequest = { startBlock: 1n, endBlock: 1000n };
      (blockReader as any)._abi = mockAbi;
      (blockReader as any).receivedBlockHandler = jest.fn(() => {});
      (blockReader as any).source.connectionState = BlockReaderConnectionState.Connected;
      (blockReader as any).source.send = jest.fn();
      (blockReader as any).resume = jest.fn(() => {});
      (blockReader as any).isLastBlock = false;
    });

    it('should handle the received block content if the ABI exists', async () => {
      await (blockReader as any).handleBlocksResultContent(mockResult);
      expect((blockReader as any).receivedBlockHandler).toHaveBeenCalled();
      expect((blockReader as any).source.send).toHaveBeenCalled();
    });

    it('should handle the error if the ABI does not exist', async () => {
      jest.spyOn(blockReader as any, 'handleError').mockImplementation(() => {});
      jest.spyOn(blockReader as any, 'abi', 'get').mockReturnValue(null);
      await (blockReader as any).handleBlocksResultContent(mockResult);
      expect((blockReader as any).handleError).toHaveBeenCalled();
    });

    it('should send an ack request if it is not the last block and the source is connected', async () => {
      (blockReader as any).isLastBlock = false;
      await (blockReader as any).handleBlocksResultContent(mockResult);
      expect((blockReader as any).source.send).toHaveBeenCalled();
    });

    it('should not send an ack request if it is the last block', async () => {
      (blockReader as any).isLastBlock = true;
      await (blockReader as any).handleBlocksResultContent(mockResult);
      expect((blockReader as any).source.send).not.toHaveBeenCalled();
    });
  });

  describe('handleError', () => {
    const mockError = new Error('Test error');

    beforeEach(() => {
      (blockReader as any).errorHandler = jest.fn();
    });

    it('should call the error handler if it exists', () => {
      (blockReader as any).handleError(mockError);
      expect((blockReader as any).errorHandler).toHaveBeenCalled();
    });
  });

  describe('handleWarning', () => {
    beforeEach(() => {
      (blockReader as any).warningHandler = jest.fn();
    });

    it('should call the warning handler if it exists', () => {
      (blockReader as any).handleWarning();
      expect((blockReader as any).warningHandler).toHaveBeenCalled();
    });
  });

  describe('connect', () => {
    it('should call the connect method of the BlockReaderSource if it is not connected', async () => {
      (blockReader as any).source.connectionState = BlockReaderConnectionState.Idle;
      (blockReader as any).source.connect = jest.fn();
      await blockReader.connect();
      expect((blockReader as any).source.connect).toHaveBeenCalled();
    });

    it('should not call the connect method of the BlockReaderSource if it is already connected', async () => {
      (blockReader as any).source.connectionState = BlockReaderConnectionState.Connected;
      (blockReader as any).source.connect = jest.fn();
      await blockReader.connect();
      expect((blockReader as any).source.connect).not.toHaveBeenCalled();
    });
  });

  describe('disconnect', () => {
    it('should call the disconnect method of the BlockReaderSource if it is connected', async () => {
      (blockReader as any).source.connectionState = BlockReaderConnectionState.Connected;
      (blockReader as any).source.disconnect = jest.fn();
      await blockReader.disconnect();
      expect((blockReader as any).source.disconnect).toHaveBeenCalled();
    });

    it('should not call the disconnect method of the BlockReaderSource if it is not connected', async () => {
      (blockReader as any).source.connectionState = BlockReaderConnectionState.Idle;
      (blockReader as any).source.disconnect = jest.fn();
      await blockReader.disconnect();
      expect((blockReader as any).source.disconnect).not.toHaveBeenCalled();
    });
  });

  describe('pause', () => {
    it('should set the paused property to true', () => {
      blockReader.pause();
      expect((blockReader as any)._paused).toBe(true);
    });
  });

  describe('resume', () => {
    beforeEach(() => {
      (blockReader as any).isLastBlock = false;
    });

    it('should set the paused property to false', () => {
      (blockReader as any).resume();
      expect((blockReader as any)._paused).toBe(false);
    });

    it('should send an ack request if the source is connected and not the last block', () => {
      (blockReader as any)._abi = { typesMap: new Map() };
      (blockReader as any).source.connectionState = BlockReaderConnectionState.Connected;
      (blockReader as any).source.send = jest.fn();
      (blockReader as any).pause();
      (blockReader as any).resume();
      expect((blockReader as any).source.send).toHaveBeenCalled();
    });

    it('should not send an ack request if it is the last block', () => {
      (blockReader as any).isLastBlock = true;
      (blockReader as any).source.send = jest.fn();
      (blockReader as any).resume();
      expect((blockReader as any).source.send).not.toHaveBeenCalled();
    });
  });

  describe('readBlocks', () => {
    const startBlock = 1n;
    const endBlock = 10n;
    const options = { shouldFetchDeltas: true, shouldFetchTraces: true };

    beforeEach(() => {
      jest.spyOn(blockReader as any, 'sendRequest').mockImplementation(() => {});
      jest.spyOn(console, 'log').mockImplementation(() => {});
    });

    it('should call sendRequest method with the correct arguments', () => {
      blockReader.readBlocks(startBlock, endBlock, options);
      expect((blockReader as any).sendRequest).toHaveBeenCalledWith(
        startBlock,
        endBlock,
        options
      );
    });

    it('should log the message with the correct arguments', () => {
      const consoleLogSpy = jest.spyOn(console, 'log');
      blockReader.readBlocks(startBlock, endBlock, options);
      expect(consoleLogSpy).toHaveBeenCalled();
    });
  });

  describe('readOneBlock', () => {
    const block = 1n;
    const options = { shouldFetchDeltas: true, shouldFetchTraces: true };

    beforeEach(() => {
      jest.spyOn(blockReader as any, 'sendRequest').mockImplementation(() => {});
      jest.spyOn(console, 'log').mockImplementation(() => {});
    });

    it('should call sendRequest method with the correct arguments', () => {
      blockReader.readOneBlock(block, options);
      expect((blockReader as any).sendRequest).toHaveBeenCalledWith(
        block,
        block + 1n,
        options
      );
    });

    it('should log the message with the correct arguments', () => {
      const consoleLogSpy = jest.spyOn(console, 'log');
      blockReader.readOneBlock(block, options);
      expect(consoleLogSpy).toHaveBeenCalled();
    });
  });

  describe('sendRequest', () => {
    const startBlock = 1n;
    const endBlock = 10n;
    const options = { shouldFetchDeltas: true, shouldFetchTraces: true };
    const mockBlockRangeRequest = {
      toJSON: jest.fn().mockReturnValue({ type: 'mock', value: {} }),
    } as any;

    beforeEach(() => {
      (blockReader as any).receivedBlockHandler = jest.fn();
      (blockReader as any)._abi = { typesMap: new Map() };
      (blockReader as any).source.connectionState = BlockReaderConnectionState.Connected;
      (blockReader as any).resume = jest.fn();
      (blockReader as any).source.send = jest.fn();
      jest.spyOn(GetBlocksRequest, 'create').mockReturnValue(mockBlockRangeRequest);
      (blockReader as any).isLastBlock = false;
    });

    it('should set the isLastBlock property to false', () => {
      (blockReader as any).sendRequest(startBlock, endBlock, options);
      expect((blockReader as any).isLastBlock).toBe(false);
    });

    it('should call GetBlocksRequest.create with the correct arguments', () => {
      (blockReader as any).sendRequest(startBlock, endBlock, options);
      expect(GetBlocksRequest.create).toHaveBeenCalledWith(startBlock, endBlock, options);
    });

    it('should call the send method of the BlockReaderSource with the correct arguments', () => {
      (blockReader as any).serializer.serialize = jest.fn(() => Uint8Array.from([]));
      (blockReader as any).sendRequest(startBlock, endBlock, options);
      expect((blockReader as any).source.send).toHaveBeenCalledWith(Uint8Array.from([]));
    });

    it('should call the resume method if the _paused property is true', () => {
      (blockReader as any).pause();
      (blockReader as any).sendRequest(startBlock, endBlock, options);
      expect(blockReader.resume).toHaveBeenCalled();
    });
  });

  describe('onReceivedBlock', () => {
    const mockHandler = () => {};

    it('should set the receivedBlockHandler with the provided handler function', () => {
      blockReader.onReceivedBlock(mockHandler);
      expect((blockReader as any).receivedBlockHandler).toBe(mockHandler);
    });
  });

  describe('onComplete', () => {
    const mockHandler = (startBlock: bigint, endBlock: bigint) => Promise.resolve();

    it('should set the blockRangeCompleteHandler with the provided handler function', () => {
      blockReader.onComplete(mockHandler);
      expect((blockReader as any).blockRangeCompleteHandler).toBe(mockHandler);
    });
  });

  describe('onError', () => {
    const mockHandler = () => {};

    it('should set the errorHandler with the provided handler function', () => {
      blockReader.onError(mockHandler);
      expect((blockReader as any).errorHandler).toBe(mockHandler);
    });
  });

  describe('onWarning', () => {
    const mockHandler = () => {};

    it('should set the warningHandler with the provided handler function', () => {
      blockReader.onWarning(mockHandler);
      expect((blockReader as any).warningHandler).toBe(mockHandler);
    });
  });
});
