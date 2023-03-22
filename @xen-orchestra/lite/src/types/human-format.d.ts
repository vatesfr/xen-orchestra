declare module "human-format" {
  type BinaryPrefix =
    | ""
    | "Ki"
    | "Mi"
    | "Gi"
    | "Ti"
    | "Pi"
    | "Ei"
    | "Zi"
    | "Yi";

  type SIPrefix =
    | "y"
    | "z"
    | "a"
    | "f"
    | "p"
    | "n"
    | "µ"
    | "m"
    | ""
    | "k"
    | "M"
    | "G"
    | "T"
    | "P"
    | "E"
    | "Z"
    | "Y";

  type ScaleName = "binary" | "SI";

  type Prefix<S extends ScaleName> = S extends "binary"
    ? BinaryPrefix
    : SIPrefix;

  interface Options<S extends ScaleName> {
    maxDecimals?: number | "auto";
    separator?: string;
    unit?: string;
    scale?: S;
    strict?: boolean;
    prefix?: Prefix<S>;
    decimals?: number;
  }

  interface Info<S extends ScaleName> {
    value: number;
    prefix: Prefix<S>;
    unit?: string;
  }

  interface ParsedInfo<S extends ScaleName> {
    value: number;
    factor: number;
    prefix: Prefix<S>;
    unit?: string;
  }

  function humanFormat<S extends ScaleName>(
    value: number,
    opts?: Options<S>
  ): string;

  namespace humanFormat {
    function bytes<S extends ScaleName>(
      value: number,
      opts?: Options<S>
    ): string;

    function parse<S extends ScaleName>(str: string, opts?: Options<S>): number;

    namespace parse {
      function raw<S extends ScaleName>(
        str: string,
        opts?: Options<S>
      ): ParsedInfo<S>;
    }

    function raw<S extends ScaleName>(
      value: number,
      opts?: Options<S>
    ): Info<S>;

    export { bytes, parse, raw, Prefix, BinaryPrefix };
  }

  export = humanFormat;
}
