import { createQueryBuilderFilter } from '@core/packages/query-builder/filter/create-query-builder-filter'
import type { QueryBuilderSchema } from '@core/packages/query-builder/types.ts'
import type { TruthyProperty } from 'complex-matcher'

export function handleTruthyPropertyNode({
  node,
  negate,
  schema,
  propertyPrefix = '',
}: {
  node: TruthyProperty
  negate: boolean
  schema: QueryBuilderSchema
  propertyPrefix?: string
}) {
  // Build the full property path including any prefix from parent Property nodes
  const fullPropertyPath = propertyPrefix ? `${propertyPrefix}:${node.name}` : node.name

  // Check if the full property path exists in the schema
  const isPropertyInSchema = schema[fullPropertyPath] !== undefined

  if (!isPropertyInSchema) {
    // Convert to "any property" filter with the boolean expression as value
    // prop? (truthy) -> any property contains prop:true
    // !prop? (falsy) -> any property doesNotContain prop:true
    const expressionValue = `${fullPropertyPath}:true`

    return createQueryBuilderFilter({
      property: '',
      operator: negate ? 'doesNotContain' : 'contains',
      value: expressionValue,
      schema,
    })
  }

  return createQueryBuilderFilter({
    property: fullPropertyPath,
    operator: negate ? 'isEmpty' : 'isNotEmpty',
    value: '',
    schema,
  })
}
