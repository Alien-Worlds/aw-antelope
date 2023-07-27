import { ShipAbi } from '../ship-abi';
import { ShipAbiModel } from '../ship-abi.types';

describe('ShipAbi', () => {
  const lastModifiedTimestamp = new Date();
  const abi = { version: '1.0' };
  const buffer = Buffer.from(JSON.stringify(abi), 'utf-8');
  const hex = buffer.toString('hex');
  const abiJson: ShipAbiModel = {
    abi: hex,
    version: 'eosio::abi/1.1',
    last_modified_timestamp: lastModifiedTimestamp,
  };
  const version = 'eosio::abi/1.1';

  describe('fromJSON', () => {
    it('should create a ShipAbi object from JSON', () => {
      const shipAbi = ShipAbi.create(abiJson);

      expect(shipAbi).toBeInstanceOf(ShipAbi);
      expect(shipAbi.abi).toEqual(hex);
      expect(shipAbi.version).toEqual(version);
    });
  });

  describe('constructor', () => {
    it('should create a ShipAbi object with the provided properties', () => {
      const shipAbi = new ShipAbi(hex, version, lastModifiedTimestamp);

      expect(shipAbi).toBeInstanceOf(ShipAbi);
      expect(shipAbi.abi).toEqual(hex);
      expect(shipAbi.version).toEqual(version);
    });
  });

  describe('toJSON', () => {
    it('should convert the ShipAbi object to JSON', () => {
      const shipAbi = new ShipAbi(hex, version, lastModifiedTimestamp);
      const json = shipAbi.toJSON();

      expect(json).toEqual(abiJson);
    });
  });
});
