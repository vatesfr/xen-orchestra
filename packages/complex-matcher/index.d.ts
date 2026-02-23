export type ComparisonOperator = '>' | '>=' | '<' | '<='

declare class BaseNode {
  createPredicate(): (value: any) => boolean
  match(value: any): boolean
  toString(isNested?: boolean): string
}

export type Node = BaseNode

export class Null extends BaseNode {}

export class And extends BaseNode {
  constructor(children: BaseNode[])
  children: BaseNode[]
}

export class Comparison extends BaseNode {
  constructor(operator: ComparisonOperator, value: number)
  _operator: ComparisonOperator
  _value: number
  static comparators: {
    [key in ComparisonOperator]: (a: number, b: number) => boolean
  }
}

export class Or extends BaseNode {
  constructor(children: BaseNode[])
  children: BaseNode[]
}

export class Not extends BaseNode {
  constructor(child: BaseNode)
  child: BaseNode
}

export class NumberNode extends BaseNode {
  constructor(value: number)
  value: number
}
export { NumberNode as Number }

export class NumberOrStringNode extends BaseNode {
  constructor(value: string)
  value: string
}
export { NumberOrStringNode as NumberOrString }

export class Property extends BaseNode {
  constructor(name: string, child: BaseNode)
  name: string
  child: BaseNode
}

export class GlobPattern extends BaseNode {
  constructor(value: string)
  value: string
}

export class RegExpNode extends BaseNode {
  constructor(pattern: string, flags?: string)
  re: RegExp
}
export { RegExpNode as RegExp }

export class StringNode extends BaseNode {
  constructor(value: string)
  value: string
}
export { StringNode as String }

export class TruthyProperty extends BaseNode {
  constructor(name: string)
  name: string
}

export function parse(input: string): Node

export function getPropertyClausesStrings(node: Node): {
  [key: string]: string[]
}

export function setPropertyClause(node: Node | undefined, name: string, child: Node | string): Node
