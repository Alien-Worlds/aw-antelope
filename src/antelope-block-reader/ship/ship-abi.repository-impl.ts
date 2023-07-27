import {
  Failure,
  FindParams,
  RepositoryImpl,
  Result,
  UpdateParams,
  UpdateStats,
  Where,
  log,
} from '@alien-worlds/aw-core';
import { DefaultAbi, ShipAbiModel } from './ship-abi.types';
import { ShipAbi } from './ship-abi';
import { ShipAbiNotFoundError } from '../antelope.block-reader.errors';

/**
 * Repository implementation for managing ShipAbi objects.
 * @class
 * @extends RepositoryImpl<ShipAbi, ShipAbiModel>
 */
export class ShipAbiRepositoryImpl extends RepositoryImpl<ShipAbi, ShipAbiModel> {
  /**
   * Update the ABI for a ShipAbi object.
   * @param {string} version - The version of the ABI to update.
   * @param {DefaultAbi} abi - The ABI to be updated.
   * @returns {Promise<Result<UpdateStats>>} A promise that resolves to the result of the update operation.
   */
  public async updateAbi(version: string, abi: DefaultAbi): Promise<Result<UpdateStats>> {
    const buffer = Buffer.from(JSON.stringify(abi), 'utf-8');
    const hex = buffer.toString('hex');
    const update = { version, lastModifiedTimestamp: new Date(), abi: hex };

    return this.update(
      UpdateParams.createUpdateOne(update, new Where().valueOf('version').isEq(version))
    );
  }

  /**
   * Get the ABI for a specific version.
   * @param {string} version - The version of the ABI to retrieve.
   * @returns {Promise<Result<DefaultAbi>>} A promise that resolves to the result containing the ABI.
   */
  public async getAbi(version: string): Promise<Result<DefaultAbi>> {
    const { content, failure } = await this.find(
      FindParams.create({ where: new Where().valueOf('version').isEq(version) })
    );

    if (content && content.length > 0) {
      if (content.length > 1) {
        log(
          `Warning! More than one ABI found for the same version "${version}". The first in the list was returned.`
        );
      }
      const buffer = Buffer.from(content[0].abi, 'hex');
      const jsonString = buffer.toString('utf-8');
      const abi = JSON.parse(jsonString);

      return Result.withContent(abi);
    } else if (content && content.length === 0) {
      return Result.withFailure(Failure.fromError(new ShipAbiNotFoundError()));
    }

    if (failure) {
      return Result.withFailure(failure);
    }
  }
}
