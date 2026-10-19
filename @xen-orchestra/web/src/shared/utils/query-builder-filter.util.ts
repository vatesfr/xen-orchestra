import { getPropertyClausesStrings, type Node, Null, parse, RegExpNode, setPropertyClause } from 'complex-matcher'
import { escapeRegExp } from 'lodash-es'

function parseFilter(filter: string): Node | undefined {
  try {
    return parse(filter)
  } catch {
    return undefined
  }
}

export function getFilterPropertyValues(filter: string, name: string): string[] {
  const root = parseFilter(filter)

  if (root === undefined) {
    return []
  }

  return getPropertyClausesStrings(root)[name] ?? []
}

// Writes the anchored regexp of the query builder "is" operator, numbers included: written bare, they would match
// as substrings
export function setFilterProperty(filter: string, name: string, value: string | undefined): string {
  const root = parseFilter(filter)

  if (root === undefined) {
    return filter
  }

  const clause = value === undefined ? undefined : new RegExpNode(`^${escapeRegExp(value)}$`)

  // complex-matcher removes the clause when given no child, and returns no node when none is left: its types omit both
  const filterNode = setPropertyClause(root instanceof Null ? undefined : root, name, clause as Node) as
    | Node
    | undefined

  return filterNode?.toString() ?? ''
}
