import { createQueryBuilderGroup } from '@core/packages/query-builder/group/create-query-builder-group'
import { handleNode } from '@core/packages/query-builder/node/handle-node'
import type { QueryBuilderSchema } from '@core/packages/query-builder/types.ts'
import { And as AndNode, Or as OrNode, Property as PropertyNode } from 'complex-matcher'

export function handlePropertyGroupNode({
  property,
  node,
  negate,
  schema,
}: {
  property: string
  node: AndNode | OrNode
  negate: boolean
  schema: QueryBuilderSchema
}) {
  const children = node.children.map(child => handleNode({ node: new PropertyNode(property, child), negate, schema }))
  const operator = node instanceof AndNode ? (negate ? 'or' : 'and') : negate ? 'and' : 'or'

  return createQueryBuilderGroup({
    operator,
    children,
    schema,
  })
}
