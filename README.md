# AW-Antelope

The AW-Antelope is part of the AlienWorlds open source project. This repository consists of three main components: **Blockchain Service**, **Smart Contract Service**, and **Serializer**.

## Dependencies

- [@alien-worlds/aw-core](https://github.com/Alien-Worlds/aw-core)
- [@alien-worlds/aw-storage-mongodb](https://github.com/Alien-Worlds/aw-storage-mongodb)
- [eosjs](https://github.com/EOSIO/eosjs)

## Table of Contents

- [Installation](#installation)
- [Block Reader](#block-reader)
- [Blockchain Service](#blockchain-service)
- [Smart Contract Service](#smart-contract-service)
- [Serializer](#serializer)
- [Contributing](#contributing)
- [License](#license)

## Installation

To install the `@alien-worlds/aw-antelope` package, use the following command:

```bash
yarn add @alien-worlds/aw-antelope
```

## Block Reader

Block Reader is responsible for managing the connection to a block reader service and handling block retrieval. It plays a crucial role in ensuring the correct interaction with the blockchain, retrieving all necessary information, and forwarding it to the appropriate handlers.

### Features

1. Connects to a State History Plugin SHIP.
2. Manages the WebSocket connection using a `AntelopeBlockReaderSource` instance.
3. Handles SHIP abis using a `AntelopeShipAbiRepository` instance.
4. Serializes and deserializes messages with a `Serializer` instance.
5. Manages the retrieval of blocks, with the ability to pause and resume this process.
6. Provides callback handlers for various events (such as receiving blocks, completion of block range retrieval, handling errors, and handling warnings).


## Blockchain Service

The Blockchain Service is responsible for handling various blockchain-related operations. This service exposes three main methods:

- `getInfo()`: Retrieves the blockchain information.
- `getHeadBlockNumber()`: Retrieves the block number of the head block.
- `getLastIrreversibleBlockNumber()`: Retrieves the block number of the last irreversible block.

## Smart Contract Service

The Smart Contract Service manages operations related to smart contracts. The service currently implements the following method:

- `getStats(contract: string)`: Retrieves the statistics of the given smart contract.

Smart Contract Service is designed not only to fetch contract statistics. The service has protected methods to fetch table data (`getOne`, `getMany` and `getAll`). Thanks to these methods, you can write your own to retrieve data from each of the tables contained in the contract. Examples of use can be found in dedicated contract packages such as [aw-contract-dao-worlds](https://github.com/Alien-Worlds/aw-contract-dao-worlds/tree/main/src/services)

```typescript
// example of retrieving table data "Candidates"
public readonly fetchCandidates = async (
  options?: GetTableRowsOptions
): Promise<Result<CandidatesRawModel[], Error>> => {
  return await this.getAll<CandidatesRawModel>('candidate_name', {
    ...options,
    code: 'dao.worlds',
    table: 'candidates',
    table_key: 'candidate_name',
  });
};

```

## Serializer

The Serializer is responsible for the serialization and deserialization of various data types. It provides the following methods:

- `getAbiFromHex(hex: string)`: Deserializes ABI from hexadecimal representation.
- `getHexFromAbi(abi: AbiType)`: Converts ABI to hexadecimal string.
- `getTypesFromAbi(abi: UnknownObject)`: Gets types from provided ABI.
- `serialize(value: unknown, type: string, types: Map<string, unknown>)`: Serializes a value to Uint8Array based on the given type.
- `deserialize(value: Uint8Array, type: string, types: Map<string, unknown>)`: Deserializes a value from Uint8Array based on the given type.
- `deserializeActionData(contract: string, action: string, data: Uint8Array, abi: string | UnknownObject)`: Deserializes the action data for a specific account and action.
- `deserializeTableRow(row: Uint8Array, abi: string | UnknownObject)`: Deserializes the table row.
- `deserializeTableRowData(table: string, data: Uint8Array, abi: string | UnknownObject)`: Deserializes a table delta for a specific table.
- `deserializeTransaction(contract: string, data: Uint8Array, abi: string | UnknownObject)`: Deserializes a transaction for a specific contract.
- `deserializeBlock(data: DataType, abi?: string | UnknownObject)`: Deserializes a block.
- `hexToUint8Array(value: string)`: Converts a hexadecimal string to Uint8Array.
- `uint8ArrayToHex(value: Uint8Array)`: Converts a Uint8Array to a hexadecimal string.

## Contributing

We welcome contributions from the community. Before contributing, please read through the existing issues on this repository to prevent duplicate submissions. New feature requests and bug reports can be submitted as an issue. If you would like to contribute code, please open a pull request.

## License

This project is licensed under the terms of the MIT license. For more information, refer to the [LICENSE](./LICENSE) file.
