import type { ValueSchema } from '@core/packages/query-builder/types.ts'

export function parseValues(values: Record<string, string> | undefined): Record<string, ValueSchema> | undefined {
  if (values === undefined) {
    return undefined
  }

  return Object.fromEntries(
    Object.keys(values).flatMap(value => [
      [
        value,
        {
          label: values[value],
          value,
        },
      ],
    ])
  )
}
