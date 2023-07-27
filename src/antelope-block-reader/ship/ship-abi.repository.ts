import { Result, UpdateStats } from '@alien-worlds/aw-core';
import { DefaultAbi } from './ship-abi.types';

export abstract class ShipAbiRepository {
  /**
   * Update the ABI for a ShipAbi object.
   * @param {string} version - The version of the ABI to update.
   * @param {DefaultAbi} abi - The ABI to be updated.
   * @returns {Promise<Result<UpdateStats>>} A promise that resolves to the result of the update operation.
   */
  public abstract updateAbi(
    version: string,
    abi: DefaultAbi
  ): Promise<Result<UpdateStats>>;
  /**
   * Get the ABI for a specific version.
   * @param {string} version - The version of the ABI to retrieve.
   * @returns {Promise<Result<DefaultAbi>>} A promise that resolves to the result containing the ABI.
   */
  public abstract getAbi(version: string): Promise<Result<DefaultAbi>>;
}
