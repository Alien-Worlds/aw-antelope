import fetch from 'node-fetch';
import {
  ContractStats,
  Failure,
  GetTableRowsOptions,
  Result,
  RpcSource,
  SmartContractDataNotFoundError,
  SmartContractService,
  log,
} from '@alien-worlds/api-core';
import { FetchContractResponse } from './eos.smart-contract.types';

/**
 * SmartContractServiceImpl class implements the SmartContractService interface and provides
 * the implementation for interacting with smart contracts.
 * @class
 */
export class EosSmartContractServiceImpl implements SmartContractService {
  /**
   * Creates an instance of SmartContractServiceImpl.
   * @param {RpcSource} rpcSource - The RPC source for making blockchain requests.
   * @param {string} name - The name of the smart contract.
   */
  constructor(
    protected rpcSource: RpcSource,
    protected serviceUrl: string,
    protected name: string
  ) {}

  protected async fetchContract(account: string): Promise<Result<FetchContractResponse>> {
    try {
      const { serviceUrl } = this;
      const res = await fetch(
        `${serviceUrl}/v2/history/get_actions?account=eosio&act.name=setabi&act.authorization.actor=${account}&limit=1&sort=asc`
      );
      const json = await res.json();

      const block_num = json.actions[0].block_num;
      return Result.withContent({ account, block_num });
    } catch (error) {
      log(`An error occurred while retrieving contract data. ${error.message}`);
      return Result.withFailure(Failure.fromError(error));
    }
  }

  /**
   * Retrieves the contract statistics for the smart contract.
   * @async
   * @returns {Promise<Result<ContractStats>>} A promise that resolves to the contract statistics.
   */
  public async getStats(contract?: string): Promise<Result<ContractStats>> {
    const name = contract || this.name;
    const stats = await this.rpcSource.getContractStats(name);

    if (!stats.first_block_num) {
      const { content, failure } = await this.fetchContract(name);

      if (!content || failure) {
        stats.first_block_num = -1;
      } else {
        stats.first_block_num = +content.block_num;
      }
    }

    return Result.withContent(stats);
  }

  /**
   * Retrieves all rows of data for the specified key and options.
   *
   * Note: Concrete implementations of the SmartContractService should extend this implementation and provide a custom `fetch<TableName>` method to retrieve the specific table.
   * Inside the `fetch<TableName>` method, developers can utilize this protected method to retrieve data with proper types.
   *
   * @async
   * @param {string} key - The key used for pagination.
   * @param {GetTableRowsOptions} options - Options for retrieving table rows.
   * @returns {Promise<Result<DataType[]>>} A promise that resolves to the result containing the rows of data.
   */
  protected async getAll<DataType>(
    key: string,
    options: GetTableRowsOptions
  ): Promise<Result<DataType[]>> {
    try {
      const rows = [];
      const { code, scope, table, limit } = options;
      const query: GetTableRowsOptions = { code, scope, table, limit: limit || 100 };
      let read = true;

      while (read) {
        const resultSize = rows.length;
        if (resultSize > 0) {
          query.lower_bound = rows.at(-1)[key];
        }

        const table = await this.rpcSource.getTableRows(query);

        if (resultSize === 0) {
          rows.push(...table.rows);
        } else if (resultSize > 0 && table.rows.length > 1) {
          rows.push(...table.rows.slice(1));
        } else {
          read = false;
        }
      }

      return Result.withContent(rows);
    } catch (error) {
      return Result.withFailure(Failure.fromError(error));
    }
  }

  /**
   * Retrieves multiple rows of data based on the provided options.
   *
   * Note: Concrete implementations of the SmartContractService should extend this implementation and provide a custom `fetch<TableName>` method to retrieve the specific table.
   * Inside the `fetch<TableName>` method, developers can utilize this protected method to retrieve data with proper types.
   *
   * @async
   * @param {GetTableRowsOptions} options - Options for retrieving table rows.
   * @returns {Promise<Result<DataType[]>>} A promise that resolves to the result containing the rows of data.
   */
  protected async getMany<DataType>(
    options: GetTableRowsOptions
  ): Promise<Result<DataType[]>> {
    try {
      const result = await this.rpcSource.getTableRows<DataType>(options);
      result.rows;
      return Result.withContent(result.rows);
    } catch (error) {
      return Result.withFailure(Failure.fromError(error));
    }
  }

  /**
   * Retrieves a single row of data based on the provided options.
   *
   * Note: Concrete implementations of the SmartContractService should extend this implementation and provide a custom `fetch<TableName>` method to retrieve the specific table.
   * Inside the `fetch<TableName>` method, developers can utilize this protected method to retrieve data with proper types.
   *
   * @async
   * @param {GetTableRowsOptions} options - Options for retrieving table rows.
   * @returns {Promise<Result<DataType>>} A promise that resolves to the result containing the row of data.
   */
  protected async getOne<DataType>(
    options: GetTableRowsOptions
  ): Promise<Result<DataType>> {
    try {
      options.limit = 1;
      const result = await this.rpcSource.getTableRows<DataType>(options);

      if (result.rows.length === 0) {
        const { table, scope, lower_bound } = options;
        return Result.withFailure(
          Failure.fromError(
            new SmartContractDataNotFoundError({ table, bound: lower_bound, scope })
          )
        );
      }

      return Result.withContent(result.rows[0]);
    } catch (error) {
      return Result.withFailure(Failure.fromError(error));
    }
  }
}
