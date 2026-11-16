import { parseValues } from '@core/packages/query-builder/schema/parse-values.ts'
import type { PropertySchema } from '@core/packages/query-builder/types.ts'
import { mapValues } from 'lodash-es'

export function withEnumeratedValues(property: PropertySchema, values: string[]): PropertySchema {
  const valueSchemas = parseValues(Object.fromEntries(values.map(value => [value, value])))

  return {
    ...property,
    operators: mapValues(property.operators, operator =>
      operator.values === undefined ? operator : { ...operator, values: valueSchemas }
    ),
  }
}
