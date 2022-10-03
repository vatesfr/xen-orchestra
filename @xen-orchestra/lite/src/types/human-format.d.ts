declare module "human-format" {
  type Options = {
    decimals?: number;
    maxDecimals?: number;
    prefix?: string;
    scale?: string;
    separator?: string;
    unit?: string;
  };

  function humanFormat(value: number, opts?: Options): number;
  function bytes(value: number): number;

  humanFormat.bytes = bytes;
  export default humanFormat;
}
