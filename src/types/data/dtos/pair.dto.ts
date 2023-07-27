export type PairModel<Key = string, Value = string> = {
  key?: Key;
  value?: Value;
  first?: Key;
  second?: Value;
};

export type PairMongoModel = PairModel;
export type PairRawModel = PairModel;
