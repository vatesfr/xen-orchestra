declare module "complex-matcher" {
  type ComparisonOperator = ">" | ">=" | "<" | "<=";

  class ComplexMatcherNode {
    createPredicate(): (value) => boolean;
  }

  class Null extends ComplexMatcherNode {
    match(): true;
    toString(): "";
  }

  class And extends ComplexMatcherNode {
    constructor(children: ComplexMatcherNode[]);
    match(value: any): boolean;
    toString(isNested?: boolean): string;
    children: ComplexMatcherNode[];
  }

  class Comparison extends ComplexMatcherNode {
    constructor(operator: ComparisonOperator, value: number);
    match(value: any): boolean;
    toString(): string;
    _operator: ComparisonOperator;
    _value: number;
  }

  class Or extends ComplexMatcherNode {
    constructor(children: ComplexMatcherNode[]);
    match(value: any): boolean;
    toString(): string;
    children: ComplexMatcherNode[];
  }

  class Not extends ComplexMatcherNode {
    constructor(child: ComplexMatcherNode);
    match(value: any): boolean;
    toString(): string;
    child: ComplexMatcherNode;
  }

  class Number extends ComplexMatcherNode {
    constructor(value: number);
    match(value: any): boolean;
    toString(): string;
    value: number;
  }

  class Property extends ComplexMatcherNode {
    constructor(name: string, child: ComplexMatcherNode);
    match(value: any): boolean;
    toString(): string;
    name: string;
    child: ComplexMatcherNode;
  }

  class GlobPattern extends ComplexMatcherNode {
    constructor(value: string);
    match(re: RegExp, value: any): boolean;
    toString(): string;
    value: string;
  }

  class RegExpNode extends ComplexMatcherNode {
    constructor(pattern: string, flags: string);
    match(value: any): boolean;
    toString(): string;
    re: RegExp;
  }

  class StringNode extends ComplexMatcherNode {
    constructor(value: string);
    match(lcValue: string, value: any): boolean;
    toString(): string;
    value: string;
  }

  class TruthyProperty extends ComplexMatcherNode {
    constructor(name: string);
    match(value: any): boolean;
    toString(): string;
  }

  function parse(
    input: string,
    pos? = 0,
    end?: input.length
  ): ComplexMatcherNode;
}
