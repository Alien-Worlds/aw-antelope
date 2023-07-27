const hexToUint8Array = hex => {
  if (typeof hex !== 'string') {
    throw new Error('Expected string containing hex digits');
  }
  if (hex.length % 2) {
    throw new Error('Odd number of hex digits');
  }
  const l = hex.length / 2;
  const result = new Uint8Array(l);
  for (let i = 0; i < l; ++i) {
    const x = parseInt(hex.substr(i * 2, 2), 16);
    if (Number.isNaN(x)) {
      throw new Error('Expected hex string');
    }
    result[i] = x;
  }
  return result;
};

export class Bytes {
  public static create(struct: string): Bytes {
    return new Bytes(struct, hexToUint8Array(struct));
  }

  public static getDefault(): Bytes {
    return new Bytes('', Uint8Array.from([]));
  }

  constructor(public readonly raw: string, public readonly data: Uint8Array) {}

  public toJSON(): { raw: string; data: number[] } {
    const { raw, data } = this;
    return {
      raw,
      data: Array.from(data),
    };
  }
}
