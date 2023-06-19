import { EosSerializer } from '../eos.serializer';
import { Serialize } from 'eosjs';
import { hexToUint8Array } from 'eosjs/dist/eosjs-serialize';
import { log } from '@alien-worlds/api-core';

jest.mock('eosjs', () => ({
  Serialize: {
    getType: jest.fn().mockReturnValue({
      serialize: jest.fn(),
      deserialize: jest.fn(),
    }),
    getTypesFromAbi: jest.fn().mockReturnValue({
      get: jest.fn(() => ({
        deserialize: jest.fn().mockReturnValue({ actions: [] }),
      })),
    }),
    createAbiTypes: jest.fn(),
    createInitialTypes: jest.fn(),
    deserializeAction: jest.fn(),
    serializeAnyvar: jest.fn(),
    deserializeAnyvar: jest.fn(),
    serializeAnyArray: jest.fn(),
    deserializeAnyArray: jest.fn(),
    serializeAnyObject: jest.fn(),
    deserializeAnyObject: jest.fn(),
    SerialBuffer: jest.fn(() => ({
      array: new Uint8Array(),
      restartRead: jest.fn(),
      asUint8Array: jest.fn(),
    })),
    SerializerState: jest.fn(() => ({})),
  },
  Abi: jest.fn(),
}));

jest.mock('@alien-worlds/api-core', () => ({
  log: jest.fn(),
}));

jest.mock('eosjs/dist/eosjs-serialize', () => ({
  hexToUint8Array: jest.fn().mockReturnValue(new Uint8Array([1, 2, 3])),
}));

describe('EosSerializer', () => {
  let eosSerializer: EosSerializer;

  beforeEach(() => {
    eosSerializer = new EosSerializer();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should serialize value properly', () => {
    const value = 'test';

    eosSerializer.serialize(value);

    expect(Serialize.serializeAnyvar).toHaveBeenCalledWith(expect.anything(), value);
  });

  it('should deserialize value properly', () => {
    const value = new Uint8Array([1, 2, 3]);

    eosSerializer.deserialize(value);

    expect(Serialize.deserializeAnyvar).toHaveBeenCalledWith(expect.anything());
  });

  it('should deserialize action properly', () => {
    const action = 'testAction';
    const contract = 'testContract';
    const data = new Uint8Array([1, 2, 3]);
    const value = '01';

    eosSerializer.deserializeAction(contract, action, data, value);

    expect(Serialize.deserializeAction).toHaveBeenCalled();
  });

  it('should deserialize table properly', () => {
    const table = 'testTable';
    const contract = 'testContract';
    const data = new Uint8Array([1, 2, 3]);
    const value = '01';

    eosSerializer.deserializeTable(contract, table, data, value);

    expect(log).not.toHaveBeenCalled();
  });

  it('should convert hex to Uint8Array properly', () => {
    const value = '01';

    const result = eosSerializer.hexToUint8Array(value);

    expect(result).toEqual(new Uint8Array([1, 2, 3]));
    expect(hexToUint8Array).toHaveBeenCalledWith(value);
  });
});
