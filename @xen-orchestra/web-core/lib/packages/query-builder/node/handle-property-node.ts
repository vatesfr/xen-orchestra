import { createQueryBuilderFilter } from '@core/packages/query-builder/filter/create-query-builder-filter'
import { handleComparisonNode } from '@core/packages/query-builder/node/handle-comparison-node'
import { handleGlobPatternNode } from '@core/packages/query-builder/node/handle-glob-pattern-node'
import { handleNode } from '@core/packages/query-builder/node/handle-node'
import { handlePropertyGroupNode } from '@core/packages/query-builder/node/handle-property-group-node'
import { handleRegExpNode } from '@core/packages/query-builder/node/handle-regexp-node'
import { handleStringOrNumberNode } from '@core/packages/query-builder/node/handle-string-or-number-node'
import { QueryBuilderError } from '@core/packages/query-builder/query-builder-error.ts'
import type { QueryBuilderSchema } from '@core/packages/query-builder/types.ts'
import {
  And as AndNode,
  Comparison as ComparisonNode,
  GlobPattern as GlobPatternNode,
  Not as NotNode,
  NumberOrStringNode,
  Or as OrNode,
  Property as PropertyNode,
  RegExpNode,
  StringNode,
  TruthyProperty as TruthyPropertyNode,
} from 'complex-matcher'

export function handlePropertyNode({
  node,
  negate,
  schema,
}: {
  node: PropertyNode
  negate: boolean
  schema: QueryBuilderSchema
}) {
  if (node.child instanceof AndNode || node.child instanceof OrNode) {
    return handlePropertyGroupNode({ property: node.name, node: node.child, negate, schema })
  }

  if (node.child instanceof StringNode || node.child instanceof NumberOrStringNode) {
    return handleStringOrNumberNode({ property: node.name, node: node.child, negate, schema })
  }

  if (node.child instanceof RegExpNode) {
    return handleRegExpNode({ property: node.name, node: node.child, negate, schema })
  }

  if (node.child instanceof ComparisonNode) {
    return handleComparisonNode({ property: node.name, node: node.child, negate, schema })
  }

  if (node.child instanceof GlobPatternNode) {
    return handleGlobPatternNode({ property: node.name, node: node.child, negate, schema })
  }

  if (node.child instanceof NotNode) {
    return handleNode({ node: new PropertyNode(node.name, node.child.child), negate: !negate, schema })
  }

  if (node.child instanceof TruthyPropertyNode) {
    return createQueryBuilderFilter({
      property: node.name,
      operator: negate ? 'isEmpty' : 'isNotEmpty',
      value: '',
      schema,
    })
  }

  throw new QueryBuilderError('unhandled property child', node.child)
}
