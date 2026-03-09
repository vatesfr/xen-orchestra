import { parseValues } from '@core/packages/query-builder/schema/parse-values.ts'
import type { OperatorSchema, OperatorsDefinition, PropertyOperator } from '@core/packages/query-builder/types.ts'

export function parseOperators(operators: OperatorsDefinition): Record<string, OperatorSchema> {
  return Object.fromEntries(
    Object.keys(operators).flatMap(operator => {
      const operatorConfig = operators[operator as PropertyOperator]

      if (operatorConfig === undefined) {
        return []
      }

      const { label, values, expectValue } = operatorConfig

      return [
        [
          operator,
          {
            label,
            operator: operator as PropertyOperator,
            expectValue: expectValue !== false,
            values: parseValues(values),
          },
        ],
      ]
    })
  )
}
