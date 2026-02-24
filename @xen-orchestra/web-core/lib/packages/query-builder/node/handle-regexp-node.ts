import { createQueryBuilderFilter } from '@core/packages/query-builder/filter/create-query-builder-filter'
import type { QueryBuilderSchema } from '@core/packages/query-builder/types.ts'
import type { RegExpNode } from 'complex-matcher'

export function handleRegExpNode({
  property,
  node,
  negate,
  schema,
}: {
  property: string
  node: RegExpNode
  negate: boolean
  schema: QueryBuilderSchema
}) {
  const startsWith = node.re.source.startsWith('^')
  const endsWith = node.re.source.endsWith('$')
  const hasRegExpChars = /[.*+?^${}()|[\]\\]/.test(node.re.source.replace(/^\^/, '').replace(/\$$/, ''))

  if (hasRegExpChars) {
    return createQueryBuilderFilter({
      property,
      operator: negate ? 'doesNotMatchRegex' : 'matchesRegex',
      value: node.re.source,
      schema,
    })
  }

  if (startsWith && endsWith) {
    return createQueryBuilderFilter({
      property,
      operator: negate ? 'isNot' : 'is',
      value: node.re.source.slice(1, -1),
      schema,
    })
  }

  if (startsWith) {
    return createQueryBuilderFilter({
      property,
      operator: negate ? 'doesNotStartWith' : 'startsWith',
      value: node.re.source.slice(1),
      schema,
    })
  }

  if (endsWith) {
    return createQueryBuilderFilter({
      property,
      operator: negate ? 'doesNotEndWith' : 'endsWith',
      value: node.re.source.slice(0, -1),
      schema,
    })
  }

  return createQueryBuilderFilter({
    property,
    operator: negate ? 'doesNotContain' : 'contains',
    value: node.re.source,
    schema,
  })
}
