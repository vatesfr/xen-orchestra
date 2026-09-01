import { createQueryBuilderFilter } from '@core/packages/query-builder/filter/create-query-builder-filter.ts'
import { handleComparisonNode } from '@core/packages/query-builder/node/handle-comparison-node.ts'
import { handleGlobPatternNode } from '@core/packages/query-builder/node/handle-glob-pattern-node.ts'
import { handleNode } from '@core/packages/query-builder/node/handle-node.ts'
import { handlePropertyGroupNode } from '@core/packages/query-builder/node/handle-property-group-node.ts'
import { handleRegExpNode } from '@core/packages/query-builder/node/handle-regexp-node.ts'
import { handleStringOrNumberNode } from '@core/packages/query-builder/node/handle-string-or-number-node.ts'
import { handleTruthyPropertyNode } from '@core/packages/query-builder/node/handle-truthy-property-node.ts'
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

function accumulatePropertyPath(node: PropertyNode): string {
  // Recursively accumulate nested property names separated by ':'
  if (node.child instanceof PropertyNode) {
    return `${node.name}:${accumulatePropertyPath(node.child)}`
  }

  return node.name
}

export function handlePropertyNode({
  node,
  negate,
  schema,
}: {
  node: PropertyNode
  negate: boolean
  schema: QueryBuilderSchema
}) {
  // Accumulate the full property path (e.g., "CPUs:number" from nested Property nodes)
  const propertyPath = accumulatePropertyPath(node)

  // Check if the property path exists in the schema. If not, treat the entire expression
  // as an "any property" filter to support queries on undefined properties
  const propertyIsInSchema = schema[propertyPath] !== undefined
  if (!propertyIsInSchema) {
    // Reconstruct the full original query expression and treat it as an "any property" filter
    const fullExpression = node.toString()
    return createQueryBuilderFilter({
      property: '',
      operator: negate ? 'doesNotContain' : 'contains',
      value: fullExpression,
      schema,
    })
  }

  // Find the innermost non-property child
  let currentNode = node as any
  while (currentNode instanceof PropertyNode) {
    currentNode = currentNode.child
  }

  if (currentNode instanceof AndNode || currentNode instanceof OrNode) {
    return handlePropertyGroupNode({ property: propertyPath, node: currentNode, negate, schema })
  }

  if (currentNode instanceof StringNode || currentNode instanceof NumberOrStringNode) {
    return handleStringOrNumberNode({ property: propertyPath, node: currentNode, negate, schema })
  }

  if (currentNode instanceof RegExpNode) {
    return handleRegExpNode({ property: propertyPath, node: currentNode, negate, schema })
  }

  if (currentNode instanceof ComparisonNode) {
    return handleComparisonNode({ property: propertyPath, node: currentNode, negate, schema })
  }

  if (currentNode instanceof GlobPatternNode) {
    return handleGlobPatternNode({ property: propertyPath, node: currentNode, negate, schema })
  }

  if (currentNode instanceof NotNode) {
    return handleNode({ node: new PropertyNode(propertyPath, currentNode.child), negate: !negate, schema })
  }

  if (currentNode instanceof TruthyPropertyNode) {
    return handleTruthyPropertyNode({ node: currentNode, negate, schema, propertyPrefix: propertyPath })
  }

  throw new QueryBuilderError('unhandled property child', currentNode)
}
