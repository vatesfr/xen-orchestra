declare module "human-format" {
  type Options = {
    decimals?: number;
    maxDecimals?: number;
    prefix?: string;
    scale?: string;
    separator?: string;
    unit?: string;
  };

  function humanformat(value: number, opts?: Options): number;
  function bytes(value: number): number;

  humanformat.bytes = bytes;
  export default humanformat;
}
