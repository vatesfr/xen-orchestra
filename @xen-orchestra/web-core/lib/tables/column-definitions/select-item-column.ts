import { useButtonIconColumn } from '@core/tables/column-definitions/button-icon-column.ts'
import type { HeaderConfig } from '@core/tables/types.ts'

export const useSelectItemColumn = (config?: HeaderConfig) =>
  useButtonIconColumn({
    buttonIcon: 'fa:eye',
    ...config,
  })
