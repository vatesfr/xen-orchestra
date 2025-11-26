import { useLiteralColumn } from '@core/tables/column-definitions/literal-column.ts'
import type { HeaderConfig } from '@core/tables/types.ts'

export const useTextColumn = (config?: HeaderConfig) => useLiteralColumn({ headerIcon: 'fa:align-left', ...config })
