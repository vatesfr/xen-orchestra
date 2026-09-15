import { createQueryBuilderFilter } from '@core/packages/query-builder/filter/create-query-builder-filter.ts'
import type { QueryBuilderSchema } from '@core/packages/query-builder/types.ts'

export function handleNullNode(config: { schema: QueryBuilderSchema }) {
  return createQueryBuilderFilter({
    property: '',
    operator: 'contains',
    value: '',
    schema: config.schema,
  })
}
