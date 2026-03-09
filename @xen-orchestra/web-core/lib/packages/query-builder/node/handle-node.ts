import { handleComparisonNode } from '@core/packages/query-builder/node/handle-comparison-node'
import { handleGlobPatternNode } from '@core/packages/query-builder/node/handle-glob-pattern-node'
import { handleGroupNode } from '@core/packages/query-builder/node/handle-group-node'
import { handleNullNode } from '@core/packages/query-builder/node/handle-null-node'
import { handlePropertyNode } from '@core/packages/query-builder/node/handle-property-node'
import { handleRegExpNode } from '@core/packages/query-builder/node/handle-regexp-node'
import { handleStringOrNumberNode } from '@core/packages/query-builder/node/handle-string-or-number-node'
import { handleTruthyPropertyNode } from '@core/packages/query-builder/node/handle-truthy-property-node'
import { QueryBuilderError } from '@core/packages/query-builder/query-builder-error.ts'
import type { QueryBuilderNode, QueryBuilderSchema } from '@core/packages/query-builder/types.ts'
import {
  And as AndNode,
  Comparison as ComparisonNode,
  GlobPattern as GlobPatternNode,
  type Node,
  Not as NotNode,
  Null as NullNode,
  NumberOrStringNode,
  Or as OrNode,
  Property as PropertyNode,
  RegExpNode,
  StringNode,
  TruthyProperty as TruthyPropertyNode,
} from 'complex-matcher'

export function handleNode({
  node,
  negate,
  schema,
}: {
  node: Node
  negate: boolean
  schema: QueryBuilderSchema
}): QueryBuilderNode {
  if (node instanceof AndNode || node instanceof OrNode) {
    return handleGroupNode({ node, negate, schema })
  }

  if (node instanceof NotNode) {
    return handleNode({ node: node.child, negate: !negate, schema })
  }

  if (node instanceof StringNode || node instanceof NumberOrStringNode) {
    return handleStringOrNumberNode({ property: '', node, negate, schema })
  }

  if (node instanceof TruthyPropertyNode) {
    return handleTruthyPropertyNode({ node, negate, schema })
  }

  if (node instanceof ComparisonNode) {
    return handleComparisonNode({ property: '', node, negate, schema })
  }

  if (node instanceof RegExpNode) {
    return handleRegExpNode({ property: '', node, negate, schema })
  }

  if (node instanceof GlobPatternNode) {
    return handleGlobPatternNode({ property: '', node, negate, schema })
  }

  if (node instanceof NullNode) {
    return handleNullNode({ schema })
  }

  if (node instanceof PropertyNode) {
    return handlePropertyNode({ node, negate, schema })
  }

  throw new QueryBuilderError('unhandled node', node)
}
