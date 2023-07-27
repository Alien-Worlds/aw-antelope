import { Result } from '@alien-worlds/aw-core';
import { ShipAbiRepository } from './ship-abi.repository';
import { DefaultAbi } from './ship-abi.types';

/**
 * Manages ShipAbi objects and provides methods to retrieve ABI based on version.
 * @class
 */
export class ShipAbis {
  private cache: Map<string, DefaultAbi> = new Map();
  /**
   * Creates an instance of ShipAbis.
   *
   * @param {ShipAbiRepository} repository - The repository to retrieve ShipAbi objects.
   */
  constructor(private repository: ShipAbiRepository) {}

  /**
   * Retrieves the ABI based on the specified version.
   *
   * @param {string} version - The version of the ABI to retrieve.
   * @returns {Promise<Result<DefaultAbi>>} A promise that resolves to the result containing the ABI.
   */
  public async getAbi(version: string): Promise<Result<DefaultAbi>> {
    if (this.cache.has(version)) {
      return Result.withContent(this.cache.get(version));
    }

    const { content: abi, failure } = await this.repository.getAbi(version);

    if (failure) {
      return Result.withFailure(failure);
    }

    this.cache.set(version, abi);

    return Result.withContent(abi);
  }
}
