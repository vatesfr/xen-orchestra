import { createQueryBuilderGroup } from '@core/packages/query-builder/group/create-query-builder-group'
import { handleNode } from '@core/packages/query-builder/node/handle-node'
import type { QueryBuilderSchema } from '@core/packages/query-builder/types.ts'
import { And as AndNode, type Or as OrNode } from 'complex-matcher'

export function handleGroupNode({
  node,
  negate,
  schema,
}: {
  node: AndNode | OrNode
  negate: boolean
  schema: QueryBuilderSchema
}) {
  const operator = node instanceof AndNode ? (negate ? 'or' : 'and') : negate ? 'and' : 'or'

  return createQueryBuilderGroup({
    operator,
    children: node.children.map(child => handleNode({ node: child, negate, schema })),
    schema,
  })
}
