/* eslint-disable @typescript-eslint/no-unused-vars */
import { ContractTable, Serializer, UnknownObject, log } from '@alien-worlds/api-core';
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
      const authorization: Authorization[] = [];
      const textEncoder = new TextEncoder();
      const textDecoder = new TextDecoder();

      if (typeof abi === 'string') {
        const bytes = hexToUint8Array(abi);
        const abiTypes = Serialize.getTypesFromAbi(Serialize.createAbiTypes());
        const buffer = new Serialize.SerialBuffer({
          textEncoder,
          textDecoder,
          array: bytes,
        });
        buffer.restartRead();
        contractAbi = abiTypes.get('abi_def').deserialize(buffer);
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
      const textEncoder = new TextEncoder();
      const textDecoder = new TextDecoder();

      if (typeof abi === 'string') {
        const bytes = hexToUint8Array(abi);
        const abiTypes = Serialize.getTypesFromAbi(Serialize.createAbiTypes());
        const buffer = new Serialize.SerialBuffer({
          textEncoder,
          textDecoder,
          array: bytes,
        });
        buffer.restartRead();
        contractAbi = abiTypes.get('abi_def').deserialize(buffer);
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

      const sb = new Serialize.SerialBuffer({ textEncoder, textDecoder, array: data });

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
    abi: string | UnknownObject,
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

      const version = sb.get(); // Read the version byte
      const actionCount = sb.getVaruint32(); // Read the number of actions

      const deserializedActions = [];
      for (let i = 0; i < actionCount; i++) {
        const account = sb.getName(); // Read the account name
        const name = sb.getName(); // Read the action name
        const authorizationCount = sb.getVaruint32(); // Read the number of authorizations

        const authorization = [];
        for (let j = 0; j < authorizationCount; j++) {
          const actor = sb.getName(); // Read the actor name
          const permission = sb.getName(); // Read the permission name
          authorization.push({ actor, permission });
        }

        const dataBytes = sb.getBytes(); // Read the data bytes

        // Deserialize the action data based on the contract and action names
        const deserializedData = this.deserializeActionData(
          contract,
          name,
          dataBytes,
          abi
        );

        deserializedActions.push({
          account,
          name,
          authorization,
          data: deserializedData,
        });
      }

      // Return the deserialized transaction object
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
    abi: string | UnknownObject,
    ...args: unknown[]
  ): ContractTable<Type> {
    const sb = new Serialize.SerialBuffer({
      textEncoder: new TextEncoder(),
      textDecoder: new TextDecoder(),
      array: data,
    });
    sb.get(); // version
    const code = sb.getName(); // code
    const scope = sb.getName(); // scope
    const table = sb.getName(); // table
    const primaryKey = Buffer.from(sb.getUint8Array(8)).readBigInt64BE(); // primary_key
    const payer = sb.getName(); // payer
    const bytes = sb.getBytes(); // data bytes
    const deserializedData = this.deserializeTableDelta<Type>(table, bytes, abi);

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

  /**
   * Converts given Uint8Array to hex string.
   *
   * @abstract
   * @param {Uint8Array} value - The Uint8Array value to be converted.
   * @returns {Uint8Array} The serialized value as Uint8Array.
   */
  public uint8ArrayToHex(value: Uint8Array): string {
    return Buffer.from(value).toString('hex');
  }
}
