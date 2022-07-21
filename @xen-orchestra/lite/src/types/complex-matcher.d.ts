declare module "complex-matcher" {
  type ComparisonOperator = ">" | ">=" | "<" | "<=";

  class Node {
    createPredicate(): (value) => boolean;
  }

  class Null extends Node {
    match(): true;
    toString(): "";
  }

  class And extends Node {
    constructor(children: Node[]);
    match(value: any): boolean;
    toString(isNested?: boolean): string;
    children: Node[];
  }

  class Comparison extends Node {
    constructor(operator: ComparisonOperator, value: number);
    match(value: any): boolean;
    toString(): string;
    _operator: ComparisonOperator;
    _value: number;
  }

  class Or extends Node {
    constructor(children: Node[]);
    match(value: any): boolean;
    toString(): string;
    children: Node[];
  }

  class Not extends Node {
    constructor(child: Node);
    match(value: any): boolean;
    toString(): string;
    child: Node;
  }

  class Number extends Node {
    constructor(value: number);
    match(value: any): boolean;
    toString(): string;
    value: number;
  }

  class Property extends Node {
    constructor(name: string, child: Node);
    match(value: any): boolean;
    toString(): string;
    name: string;
    child: Node;
  }

  class GlobPattern extends Node {
    constructor(value: string);
    match(re: RegExp, value: any): boolean;
    toString(): string;
    value: string;
  }

  class RegExpNode extends Node {
    constructor(pattern: string, flags: string);
    match(value: any): boolean;
    toString(): string;
    re: RegExp;
  }

  class StringNode extends Node {
    constructor(value: string);
    match(lcValue: string, value: any): boolean;
    toString(): string;
    value: string;
  }

  class TruthyProperty extends Node {
    constructor(name: string);
    match(value: any): boolean;
    toString(): string;
  }

  function parse(input: string, pos? = 0, end?: input.length): Node;
}
