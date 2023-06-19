/* eslint-disable @typescript-eslint/no-unused-vars */
import { Serializer, log } from '@alien-worlds/api-core';
import { Serialize } from 'eosjs';
import { Abi } from 'eosjs/dist/eosjs-rpc-interfaces';
import { Anyvar, Authorization } from 'eosjs/dist/eosjs-serialize';
import { hexToUint8Array } from 'eosjs/dist/eosjs-serialize';

export class EosSerializer implements Serializer {
  /**
   * Deserializes the action data for a specific account and action.
   *
   * @param {string} contract - The contract associated with the action.
   * @param {string} action - The action name.
   * @param {Uint8Array} data - The raw data to be deserialized.
   * @param {string} value - The hexadecimal representation of the data.
   * @returns {Type} The deserialized action data.
   */
  deserializeAction<Type = unknown>(
    contract: string,
    action: string,
    data: Uint8Array,
    value: string,
    ...args: unknown[]
  ): Type {
    try {
      const authorization: Authorization[] = [];
      const textEncoder = new TextEncoder();
      const textDecoder = new TextDecoder();
      const bytes = hexToUint8Array(value);
      const abiTypes = Serialize.getTypesFromAbi(Serialize.createAbiTypes());
      const buffer = new Serialize.SerialBuffer({
        textEncoder,
        textDecoder,
        array: bytes,
      });
      buffer.restartRead();
      const abi: Abi = abiTypes.get('abi_def').deserialize(buffer);
      const types = Serialize.getTypesFromAbi(Serialize.createInitialTypes(), abi);
      const actions = new Map();
      for (const { name, type } of abi.actions) {
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

      return deserializedAction.data as Type;
    } catch (error) {
      log(error);
      return null;
    }
  }

  /**
   * Deserializes the table data for a specific contract and table.
   *
   * @param {string} contract - The contract associated with the table.
   * @param {string} table - The table name.
   * @param {Uint8Array} data - The raw data to be deserialized.
   * @param {string} value - The hexadecimal representation of the data.
   * @returns {Type} The deserialized table data.
   */
  deserializeTable<Type = unknown>(
    contract: string,
    table: string,
    data: Uint8Array,
    value: string,
    ...args: unknown[]
  ): Type {
    try {
      const textEncoder = new TextEncoder();
      const textDecoder = new TextDecoder();
      const bytes = hexToUint8Array(value);
      const abiTypes = Serialize.getTypesFromAbi(Serialize.createAbiTypes());
      const buffer = new Serialize.SerialBuffer({
        textEncoder,
        textDecoder,
        array: bytes,
      });
      buffer.restartRead();
      const abi: Abi = abiTypes.get('abi_def').deserialize(buffer);
      const types = Serialize.getTypesFromAbi(Serialize.createInitialTypes(), abi);

      const actions = new Map();
      for (const { name, type } of abi.actions) {
        actions.set(name, Serialize.getType(types, type));
      }
      const contract = { types, actions };

      let this_table, type: string;
      for (const t of abi.tables) {
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

      const sb = new Serialize.SerialBuffer({ textEncoder, textDecoder, array: data });

      return contract.types.get(type).deserialize(sb) as Type;
    } catch (e) {
      return null;
    }
  }

  /**
   * Serializes a value to Uint8Array based on the given type.
   * @abstract
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
   * @abstract
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
   * @abstract
   * @param {string} value - The value to be serialized.
   * @returns {Uint8Array} The serialized value as Uint8Array.
   */
  public hexToUint8Array(value: string): Uint8Array {
    return hexToUint8Array(value);
  }
}
