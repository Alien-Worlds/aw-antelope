import { Anyvar, Authorization, arrayToHex } from 'eosjs/dist/eosjs-serialize';
/* eslint-disable @typescript-eslint/no-unused-vars */
import { Row, Serializer, TableRow, UnknownObject, log } from '@alien-worlds/aw-core';

import { Abi } from 'eosjs/dist/eosjs-rpc-interfaces';
import { RawBlock } from './antelope.serializer.types';
import { Serialize } from 'eosjs';
import { hexToUint8Array } from 'eosjs/dist/eosjs-serialize';
import { ShipAbiRepository } from '../block-reader';

/**
 * Serializer implementation for Antelope.
 */
export class AntelopeSerializer implements Serializer {
  constructor(protected shipAbis: ShipAbiRepository, protected logErrors = true) {}

  /**
   * Method to deserialize ABI from hexadecimal representation.
   *
   * @async
   * @param {string} hex - The hexadecimal representation of the ABI.
   * @returns {Promise<AbiType>} The deserialized ABI.
   */
  public async getAbiFromHex<AbiType = Abi>(hex: string): Promise<AbiType> {
    try {
      const textEncoder = new TextEncoder();
      const textDecoder = new TextDecoder();
      const bytes = hexToUint8Array(hex);
      const abiTypes = Serialize.getTypesFromAbi(Serialize.createAbiTypes());
      const buffer = new Serialize.SerialBuffer({
        textEncoder,
        textDecoder,
        array: bytes,
      });
      buffer.restartRead();
      return abiTypes.get('abi_def').deserialize(buffer);
    } catch (error) {
      if (this.logErrors) {
        log(`Unable to convert hex to abi. ${error.message}`);
      }
      return null;
    }
  }

  /**
   * Method to convert ABI to hexadecimal string.
   * @async
   * @param {AbiType} abi - The ABI object.
   * @returns {Promise<string>} The ABI hex string.
   */
  public async getHexFromAbi<AbiType = Abi>(abi: AbiType): Promise<string> {
    try {
      const buffer = new Serialize.SerialBuffer({
        textEncoder: new TextEncoder(),
        textDecoder: new TextDecoder(),
      });

      const types = await this.getTypesFromAbi(abi);
      const type = types.get('abi_def');
      type.serialize(buffer, abi);
      return this.uint8ArrayToHex(buffer.asUint8Array());
    } catch (error) {
      if (this.logErrors) {
        log(`Unable to convert abi to hex. ${error.message}`);
      }
      return '';
    }
  }

  /**
   * Method to get types from provided ABI.
   * @async
   * @param {Abi} abi
   * @returns {Promise<Map<string, Serialize.Type>>}
   */
  public async getTypesFromAbi<Type = Serialize.Type, AbiType = Abi>(
    abi: AbiType
  ): Promise<Map<string, Type>> {
    try {
      return Serialize.getTypesFromAbi(
        Serialize.createAbiTypes(),
        abi as unknown as Abi
      ) as Map<string, Type>;
    } catch (error) {
      if (this.logErrors) {
        log(`Unable to extract types from abi. ${error.message}`);
      }
      return new Map();
    }
  }

  /**
   * Deserializes a block.
   *
   * @async
   * @param {RawBlock} data - The raw block data.
   * @param {string | UnknownObject} abi - ABI in the form of a hexadecimal string or as an object. If the ABI is not given then any internal Uint8Array will not be parsed.
   * @param {...unknown[]} args - Additional arguments for deserialization if needed.
   * @returns {Promise<ReturnType>} The deserialized block.
   */
  public async deserializeBlock<ReturnType = UnknownObject>(
    data: RawBlock,
    abi?: string | UnknownObject,
    ...args: unknown[]
  ): Promise<ReturnType> {
    try {
      let contractAbi;

      if (!abi) {
        const { content, failure } = await this.shipAbis.getAbi(data.abi_version);

        if (failure) {
          if (this.logErrors) {
            log(
              `Unable to get SHiP ABI for version "${data.abi_version}". ${failure.error}`
            );
          }
          return null;
        }

        contractAbi = content;

      } else if (typeof abi === 'string') {
        contractAbi = await this.getAbiFromHex(abi);
      } else {
        contractAbi = abi as unknown as Abi;
      }

      const types = Serialize.getTypesFromAbi(
        Serialize.createInitialTypes(),
        contractAbi
      );
      let block;
      let traces;
      let deltas;

      if (data.block && data.block.length > 0) {
        block = await this.deserialize(data.block, 'signed_block', types);
      }

      if (data.traces && data.traces.length > 0) {
        traces = await this.deserialize(data.traces, 'transaction_trace[]', types);
      }

      if (data.deltas && data.deltas.length > 0) {
        deltas = await this.deserialize(data.deltas, 'table_delta[]', types);
      }

      return {
        ...data,
        block,
        traces,
        deltas,
      } as ReturnType;
    } catch (error) {
      if (this.logErrors) {
        log(
          `Unable to deserialize block, most likely data cannot be deserialized using eosjs.Serialize or mising ABI. ${error}`
        );
      }
      return null;
    }
  }

  /**
   * Deserializes the action data for a specific account and action.
   *
   * @async
   * @param {string} contract - The contract associated with the action.
   * @param {string} action - The action name.
   * @param {Uint8Array} data - The raw data to be deserialized.
   * @param {string | UnknownObject} abi - ABI in the form of a hexadecimal string or as an object. If the ABI is not given then any internal Uint8Array will not be parsed.
   * @returns {Promise<Type>} The deserialized action data.
   */
  public async deserializeActionData<T = UnknownObject>(
    contract: string,
    action: string,
    data: Uint8Array,
    abi: string | UnknownObject,
    ...args: unknown[]
  ): Promise<T> {
    try {
      let contractAbi: Abi;
      if (typeof abi === 'string') {
        contractAbi = await this.getAbiFromHex(abi);
      } else {
        contractAbi = abi as unknown as Abi;
      }
      const types = Serialize.getTypesFromAbi(
        Serialize.createInitialTypes(),
        contractAbi
      );

      const authorization: Authorization[] = [];
      const actions = new Map();
      for (const { name, type } of contractAbi.actions) {
        actions.set(name, Serialize.getType(types, type));
      }
      const contractData = { types, actions };
      const deserializedAction = Serialize.deserializeAction(
        contractData,
        contract,
        action,
        authorization,
        data,
        new TextEncoder(),
        new TextDecoder()
      );

      if (!deserializedAction.data) {
        log(
          `Serialized object is empty check the result of "Serialize.deserializeAction"`
        );
        log(deserializedAction);
      }

      return deserializedAction.data as T;
    } catch (error) {
      if (this.logErrors) {
        log(
          `Unable to deserialize action data, most likely data cannot be deserialized using eosjs.Serialize. ${error.message}`
        );
      }
      return null;
    }
  }

  /**
   * Deserializes a table delta for a specific table.
   *
   * @async
   * @param {string} table - The table name.
   * @param {Uint8Array} data - The raw data to be deserialized.
   * @param {string | UnknownObject} abi - ABI in the form of a hexadecimal string or as an object. If the ABI is not given then any internal Uint8Array will not be parsed.
   * @returns {Promise<Type>} The deserialized table delta.
   */
  public async deserializeTableRowData<T = UnknownObject>(
    table: string,
    data: Uint8Array,
    abi: string | UnknownObject,
    ...args: unknown[]
  ): Promise<T> {
    try {
      let contractAbi: Abi;

      if (typeof abi === 'string') {
        contractAbi = await this.getAbiFromHex(abi);
      } else {
        contractAbi = abi as unknown as Abi;
      }

      const types = Serialize.getTypesFromAbi(
        Serialize.createInitialTypes(),
        contractAbi
      );

      const actions = new Map();
      for (const { name, type } of contractAbi.actions) {
        actions.set(name, Serialize.getType(types, type));
      }
      const contract = { types, actions };

      let this_table, type: string;
      for (const t of contractAbi.tables) {
        if (t.name === table) {
          this_table = t;
          break;
        }
      }

      if (this_table) {
        type = this_table.type;
      } else {
        return null;
      }

      const sb = new Serialize.SerialBuffer({
        textEncoder: new TextEncoder(),
        textDecoder: new TextDecoder(),
        array: data,
      });

      return contract.types.get(type).deserialize(sb) as T;
    } catch (error) {
      if (this.logErrors) {
        log(
          `Unable to deserialize table row data, most likely data cannot be deserialized using eosjs.Serialize. ${error.message}`
        );
      }
      return null;
    }
  }

  /**
   * Deserializes a transaction for a specific contract.
   *
   * @async
   * @param {string} contract - The contract associated with the transaction.
   * @param {Uint8Array} data - The raw data to be deserialized.
   * @param {string | UnknownObject} abi - ABI in the form of a hexadecimal string or as an object. If the ABI is not given then any internal Uint8Array will not be parsed.
   * @returns {Promise<Type>} The deserialized transaction.
   */
  public async deserializeTransaction<T = unknown>(
    contract: string,
    data: Uint8Array,
    abi?: string | UnknownObject,
    ...args: unknown[]
  ): Promise<T> {
    try {
      const textEncoder = new TextEncoder();
      const textDecoder = new TextDecoder();
      const sb = new Serialize.SerialBuffer({
        textEncoder,
        textDecoder,
        array: data,
      });

      const version = sb.get();
      const actionCount = sb.getVaruint32();

      const deserializedActions = [];
      for (let i = 0; i < actionCount; i++) {
        const account = sb.getName();
        const name = sb.getName();
        const authorizationCount = sb.getVaruint32();

        const authorization = [];
        for (let j = 0; j < authorizationCount; j++) {
          const actor = sb.getName();
          const permission = sb.getName();
          authorization.push({ actor, permission });
        }

        const dataBytes = sb.getBytes();

        const deserializedData = abi
          ? await this.deserializeActionData(contract, name, dataBytes, abi)
          : dataBytes;

        deserializedActions.push({
          account,
          name,
          authorization,
          data: deserializedData,
        });
      }

      return [version, { actions: deserializedActions }] as T;
    } catch (error) {
      if (this.logErrors) {
        log(
          `Unable to deserialize transaction, most likely data cannot be deserialized using eosjs.Serialize. ${error.message}`
        );
      }
      return null;
    }
  }

  /**
   * Deserializes the table.
   *
   * @async
   * @param {Uint8Array} data - The raw data to be deserialized.
   * @param {string | UnknownObject} abi - ABI in the form of a hexadecimal string or as an object. If the ABI is not given then any internal Uint8Array will not be parsed.
   * @returns {TableRow<Type>} The deserialized table data.
   */
  public async deserializeTableRow<Type = unknown>(
    row: Row,
    abi?: string | UnknownObject,
    ...args: unknown[]
  ): Promise<TableRow<Type | Uint8Array>> {
    try {
      const { data, present } = row;
      const sb = new Serialize.SerialBuffer({
        textEncoder: new TextEncoder(),
        textDecoder: new TextDecoder(),
        array: data,
      });
      sb.get();
      const code = sb.getName();
      const scope = sb.getName();
      const table = sb.getName();
      const primaryKey = Buffer.from(sb.getUint8Array(8)).readBigInt64BE();
      const payer = sb.getName();
      const bytes = sb.getBytes();
      const deserializedData = abi
        ? await this.deserializeTableRowData<Type>(table, bytes, abi)
        : bytes;

      return {
        code,
        scope,
        table,
        primary_key: primaryKey.toString(),
        payer,
        present,
        data: deserializedData,
      };
    } catch (error) {
      if (this.logErrors) {
        log(
          `Unable to deserialize table row, most likely data cannot be deserialized using eosjs.Serialize. ${error.message}`
        );
      }
      return null;
    }
  }

  /**
   * Serializes a value to Uint8Array based on the given type.
   *
   * @async
   * @param {unknown} value - The value to be serialized.
   * @param {string} type - The type of the value to be serialized.
   * @param {Map<string, unknown>} types - The map of available types for serialization.
   * @param {...unknown[]} args - Additional arguments for serialization if needed.
   * @returns {Promise<Uint8Array>} The serialized value as Uint8Array.
   */
  public async serialize(
    value: unknown,
    type?: string,
    types?: Map<string, Serialize.Type>,
    ...args: unknown[]
  ): Promise<Uint8Array> {
    const buffer = new Serialize.SerialBuffer({
      textEncoder: new TextEncoder(),
      textDecoder: new TextDecoder(),
    });

    if (types && type) {
      Serialize.getType(types, type).serialize(buffer, value);
    } else {
      Serialize.serializeAnyvar(buffer, value as Anyvar);
    }

    return buffer.asUint8Array();
  }

  /**
   * Deserializes a value from Uint8Array based on the given type.
   *
   * @async
   * @param {Uint8Array} value - The value to be deserialized as Uint8Array.
   * @param {string} type - The type of the value to be deserialized.
   * @param {Map<string, unknown>} types - The map of available types for deserialization.
   * @param {...unknown[]} args - Additional arguments for deserialization if needed.
   * @returns {Promise<Type>} The deserialized value.
   */
  public async deserialize<Type = unknown>(
    value: Uint8Array,
    type?: string,
    types?: Map<string, Serialize.Type>,
    ...args: unknown[]
  ): Promise<Type> {
    try {
      const textEncoder = new TextEncoder();
      const textDecoder = new TextDecoder();
      const buffer = new Serialize.SerialBuffer({
        textEncoder,
        textDecoder,
        array: value,
      });
      if (types && type) {
        const result = Serialize.getType(types, type).deserialize(
          buffer,
          new Serialize.SerializerState({ bytesAsUint8Array: true })
        );
        return result;
      } else {
        return Serialize.deserializeAnyvar(buffer);
      }
    } catch (error) {
      if (this.logErrors) {
        log(
          `Unable to deserialize data, most likely data cannot be deserialized using eosjs.Serialize. ${error.message}`
        );
      }
      return null;
    }
  }

  /**
   * Converts given hex string to Uint8Array.
   *
   * @async
   * @param {string} value - The value to be serialized.
   * @returns {Uint8Array} The serialized value as Uint8Array.
   */
  public async hexToUint8Array(value: string): Promise<Uint8Array> {
    return hexToUint8Array(value);
  }

  /**
   * Converts given Uint8Array to hex string.
   *
   * @async
   * @param {Uint8Array} value - The Uint8Array value to be converted.
   * @returns {Uint8Array} The serialized value as Uint8Array.
   */
  public async uint8ArrayToHex(value: Uint8Array): Promise<string> {
    return arrayToHex(value);
  }
}
