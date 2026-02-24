import { parseOperators } from '@core/packages/query-builder/schema/parse-operators.ts'
import type { PropertyPath, QueryBuilderSchema, QueryBuilderSchemaInput } from '@core/packages/query-builder/types.ts'

export function useQueryBuilderSchema<TSource>(schema: QueryBuilderSchemaInput<TSource>): QueryBuilderSchema {
  return Object.fromEntries(
    Object.keys(schema).flatMap(property => {
      const config = schema[property as PropertyPath<TSource>]

      if (config === undefined) {
        return []
      }

      return [
        [
          property,
          {
            label: config.label,
            property,
            operators: parseOperators(config.operators),
          },
        ],
      ]
    })
  )
}
