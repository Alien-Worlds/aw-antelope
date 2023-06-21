/* eslint-disable @typescript-eslint/no-unused-vars */
import { ContractTable, Serializer, UnknownObject, log } from '@alien-worlds/api-core';
import { Serialize } from 'eosjs';
import { Abi } from 'eosjs/dist/eosjs-rpc-interfaces';
import { Anyvar, Authorization } from 'eosjs/dist/eosjs-serialize';
import { hexToUint8Array } from 'eosjs/dist/eosjs-serialize';
import { RawBlock } from './eos.serializer.types';

/**
 * Serializer implementation for EOS.
 */
export class EosSerializer implements Serializer {
  /**
   * Private method to deserialize ABI from hexadecimal representation.
   *
   * @private
   * @param {string} hex - The hexadecimal representation of the ABI.
   * @returns {Abi} The deserialized ABI.
   */
  private getAbiFromHex(hex: string): Abi {
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
  }

  /**
   * Deserializes a block.
   *
   * @param {RawBlock} data - The raw block data.
   * @param {string | UnknownObject} abi - The hexadecimal representation of the ABI or raw object.
   * @param {...unknown[]} args - Additional arguments for deserialization if needed.
   * @returns {ReturnType} The deserialized block.
   */
  public deserializeBlock<ReturnType = UnknownObject>(
    data: RawBlock,
    abi?: string | UnknownObject,
    ...args: unknown[]
  ): ReturnType {
    let contractAbi: Abi;

    if (typeof abi === 'string') {
      contractAbi = this.getAbiFromHex(abi);
    } else {
      contractAbi = abi as unknown as Abi;
    }

    const types = Serialize.getTypesFromAbi(Serialize.createInitialTypes(), contractAbi);
    let block;
    let traces;
    let deltas;

    if (data.block && data.block.length > 0) {
      block = this.deserialize(data.block, 'signed_block', types);
    }

    if (data.traces && data.traces.length > 0) {
      traces = this.deserialize(data.traces, 'transaction_trace[]', types);
    }

    if (data.deltas && data.deltas.length > 0) {
      deltas = this.deserialize(data.deltas, 'table_delta[]', types);
    }

    return {
      block,
      traces,
      deltas,
    } as ReturnType;
  }

  /**
   * Deserializes the action data for a specific account and action.
   *
   * @param {string} contract - The contract associated with the action.
   * @param {string} action - The action name.
   * @param {Uint8Array} data - The raw data to be deserialized.
   * @param {string | UnknownObject} abi - The hexadecimal representation of the abi or raw object.
   * @returns {Type} The deserialized action data.
   */
  public deserializeActionData<T = UnknownObject>(
    contract: string,
    action: string,
    data: Uint8Array,
    abi: string | UnknownObject,
    ...args: unknown[]
  ): T {
    try {
      let contractAbi: Abi;
      if (typeof abi === 'string') {
        contractAbi = this.getAbiFromHex(abi);
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
      log(error);
      return null;
    }
  }

  /**
   * Deserializes a table delta for a specific table.
   *
   * @param {string} table - The table name.
   * @param {Uint8Array} data - The raw data to be deserialized.
   * @param {string | UnknownObject} abi - The hexadecimal representation of the abi or raw object.
   * @returns {Type} The deserialized table delta.
   */
  public deserializeTableDelta<T = UnknownObject>(
    table: string,
    data: Uint8Array,
    abi: string | UnknownObject,
    ...args: unknown[]
  ): T {
    try {
      let contractAbi: Abi;
      if (typeof abi === 'string') {
        contractAbi = this.getAbiFromHex(abi);
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
    } catch (e) {
      return null;
    }
  }

  /**
   * Deserializes a transaction for a specific contract.
   *
   * @param {string} contract - The contract associated with the transaction.
   * @param {Uint8Array} data - The raw data to be deserialized.
   * @param {string | UnknownObject} abi - The hexadecimal representation of the abi or raw object.
   * @returns {Type} The deserialized transaction.
   */
  public deserializeTransaction<T = unknown>(
    contract: string,
    data: Uint8Array,
    abi?: string | UnknownObject,
    ...args: unknown[]
  ): T {
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
          ? this.deserializeActionData(contract, name, dataBytes, abi)
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
      console.error('Error deserializing transaction:', error);
      return null;
    }
  }

  /**
   * Deserializes the table.
   *
   * @param {Uint8Array} data - The raw data to be deserialized.
   * @param {string | UnknownObject} abi - The hexadecimal representation of the abi or raw object.
   * @returns {ContractTable<Type>} The deserialized table data.
   */
  public deserializeTable<Type = unknown>(
    data: Uint8Array,
    abi?: string | UnknownObject,
    ...args: unknown[]
  ): ContractTable<Type | Uint8Array> {
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
      ? this.deserializeTableDelta<Type>(table, bytes, abi)
      : bytes;

    return {
      code,
      scope,
      table,
      primaryKey: primaryKey.toString(),
      payer,
      data: deserializedData,
    };
  }

  /**
   * Serializes a value to Uint8Array based on the given type.
   *
   * @param {unknown} value - The value to be serialized.
   * @param {string} type - The type of the value to be serialized.
   * @param {Map<string, unknown>} types - The map of available types for serialization.
   * @param {...unknown[]} args - Additional arguments for serialization if needed.
   * @returns {Uint8Array} The serialized value as Uint8Array.
   */
  public serialize(
    value: unknown,
    type?: string,
    types?: Map<string, Serialize.Type>,
    ...args: unknown[]
  ): Uint8Array {
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
   * @param {Uint8Array} value - The value to be deserialized as Uint8Array.
   * @param {string} type - The type of the value to be deserialized.
   * @param {Map<string, unknown>} types - The map of available types for deserialization.
   * @param {...unknown[]} args - Additional arguments for deserialization if needed.
   * @returns {Type} The deserialized value.
   */
  public deserialize<Type = unknown>(
    value: Uint8Array,
    type?: string,
    types?: Map<string, Serialize.Type>,
    ...args: unknown[]
  ): Type {
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
  }

  /**
   * Converts given hex string to Uint8Array.
   *
   * @param {string} value - The value to be serialized.
   * @returns {Uint8Array} The serialized value as Uint8Array.
   */
  public hexToUint8Array(value: string): Uint8Array {
    return hexToUint8Array(value);
  }

  /**
   * Converts given Uint8Array to hex string.
   *
   * @param {Uint8Array} value - The Uint8Array value to be converted.
   * @returns {Uint8Array} The serialized value as Uint8Array.
   */
  public uint8ArrayToHex(value: Uint8Array): string {
    return Buffer.from(value).toString('hex');
  }
}
