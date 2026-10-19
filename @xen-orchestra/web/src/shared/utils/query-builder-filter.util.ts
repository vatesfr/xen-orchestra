import {
  And,
  getPropertyClausesStrings,
  type Node,
  Not,
  Null,
  Or,
  parse,
  Property,
  RegExpNode,
  TruthyProperty,
} from 'complex-matcher'
import { escapeRegExp } from 'lodash-es'

function readFilter<TResult>(filter: string, unparsableResult: TResult, read: (root: Node) => TResult): TResult {
  let root: Node

  try {
    root = parse(filter)
  } catch {
    return unparsableResult
  }

  return read(root)
}

function getTopLevelClauses(root: Node): Node[] {
  if (root instanceof Null) {
    return []
  }

  return root instanceof And ? root.children : [root]
}

function editFilterClauses(filter: string, edit: (clauses: Node[]) => Node[]): string {
  return readFilter(filter, filter, root => new And(edit(getTopLevelClauses(root))).toString())
}

// The only form the query builder "is" operator writes: `name:…`
function isPositiveValueClause(clause: Node, name: string): boolean {
  return clause instanceof Property && clause.name === name
}

// Every form the query builder writes for a property: `name:…`, `name?`, and their `!` negations
function isAnyFormClause(clause: Node, name: string): boolean {
  const node = clause instanceof Not ? clause.child : clause

  return isPositiveValueClause(node, name) || (node instanceof TruthyProperty && node.name === name)
}

function findNestedClauses(node: Node, name: string): Node[] {
  if (isAnyFormClause(node, name)) {
    return [node]
  }

  if (node instanceof And || node instanceof Or) {
    return node.children.flatMap(child => findNestedClauses(child, name))
  }

  return node instanceof Not ? findNestedClauses(node.child, name) : []
}

export function isFilterParsable(filter: string): boolean {
  return readFilter(filter, false, () => true)
}

export function getFilterPropertyValues(filter: string, name: string): string[] {
  return readFilter(filter, [], root => getPropertyClausesStrings(root)[name] ?? [])
}

export function getFilterPropertyClauses(filter: string, name: string): string[] {
  return readFilter(filter, [], root =>
    getTopLevelClauses(root)
      .filter(clause => isAnyFormClause(clause, name))
      .map(clause => clause.toString())
  )
}

// Unlike the other readers, it also counts the clauses nested in a group: `|(name:… other:…)`, `!(name:…)`
export function countFilterPropertyClauses(filter: string, name: string): number {
  return readFilter(filter, 0, root => findNestedClauses(root, name).length)
}

// Writes the anchored regexp of the query builder "is" operator, numbers included: written bare, they would match
// as substrings
export function setFilterProperty(filter: string, name: string, value: string | undefined): string {
  return editFilterClauses(filter, clauses => {
    const otherClauses = clauses.filter(clause => !isPositiveValueClause(clause, name))

    if (value === undefined) {
      return otherClauses
    }

    return [...otherClauses, new Property(name, new RegExpNode(`^${escapeRegExp(value)}$`))]
  })
}

export function removeFilterProperty(filter: string, name: string): string {
  return editFilterClauses(filter, clauses => clauses.filter(clause => !isAnyFormClause(clause, name)))
}

export function addFilterClause(filter: string, clause: string): string {
  return readFilter(clause, filter, clauseNode =>
    editFilterClauses(filter, clauses => [...clauses, ...getTopLevelClauses(clauseNode)])
  )
}
