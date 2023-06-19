import { Result } from '@alien-worlds/api-core';
import { EosSmartContractServiceImpl } from '../eos.smart-contract.service-impl';

const rpc = {
  getTableRows: jest.fn(),
  getContractStats: jest.fn(),
};

describe('Smart Contract Service Unit tests', () => {
  afterAll(() => {
    jest.clearAllMocks();
  });

  it('"getStats" should return a result of the rpc.getContractStats method', async () => {
    const service = new EosSmartContractServiceImpl(rpc as any, 'localhost', 'foo');
    rpc.getContractStats.mockResolvedValue({ foo: 'foo' });

    const result = await service.getStats();
    expect(result).toEqual(Result.withContent({ first_block_num: -1, foo: 'foo' }));
  });

  it('"getMany" should return a failure when rows length is 0', async () => {
    const service = new EosSmartContractServiceImpl(rpc as any, 'localhost', 'foo');
    rpc.getTableRows.mockResolvedValue({ rows: [] });

    const result = await (service as any).getMany({} as any);
    expect(result.content).toEqual([]);
  });

  it('"getMany" should return a failure when rpc call fail', async () => {
    const service = new EosSmartContractServiceImpl(rpc as any, 'localhost', 'foo');
    rpc.getTableRows.mockRejectedValue(new Error());

    const result = await (service as any).getMany({} as any);
    expect(result.failure).toBeTruthy();
    expect(result.content).toBeFalsy();
  });

  it('"getMany" should return an array of data', async () => {
    const service = new EosSmartContractServiceImpl(rpc as any, 'localhost', 'foo');
    rpc.getTableRows.mockResolvedValue({ rows: [{ foo: 'foo' }] });

    const result = await (service as any).getMany({} as any);
    expect(result.content).toEqual([{ foo: 'foo' }]);
    expect(result.failure).toBeFalsy();
  });

  it('"getOne" should return a failure when rows length is 0', async () => {
    const service = new EosSmartContractServiceImpl(rpc as any, 'localhost', 'foo');
    rpc.getTableRows.mockResolvedValue({ rows: [] });

    const result = await (service as any).getOne({} as any);
    expect(result.failure).toBeTruthy();
    expect(result.content).toBeFalsy();
  });

  it('"getOne" should return a failure when rpc call fail', async () => {
    const service = new EosSmartContractServiceImpl(rpc as any, 'localhost', 'foo');
    rpc.getTableRows.mockRejectedValue(new Error());

    const result = await (service as any).getOne({} as any);
    expect(result.failure).toBeTruthy();
    expect(result.content).toBeFalsy();
  });

  it('"getOne" should return an array of data', async () => {
    const service = new EosSmartContractServiceImpl(rpc as any, 'localhost', 'foo');
    rpc.getTableRows.mockResolvedValue({ rows: [{ foo: 'foo' }] });

    const result = await (service as any).getOne({} as any);
    expect(result.content).toEqual({ foo: 'foo' });
    expect(result.failure).toBeFalsy();
  });
});
