export type BlockNumberWithId = {
  block_num: string;
  block_id: string;
};

export type RawBlock = {
  head?: BlockNumberWithId;
  this_block?: BlockNumberWithId;
  last_irreversible?: BlockNumberWithId;
  prev_block?: BlockNumberWithId;
  block?: Uint8Array;
  traces?: Uint8Array;
  deltas?: Uint8Array;
  abi_version?: string;
};
