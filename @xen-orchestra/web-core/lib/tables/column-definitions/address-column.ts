import { useCollapsedListColumn } from '@core/tables/column-definitions/collapsed-list-column.ts'
import type { HeaderConfig } from '@core/tables/types.ts'

export const useAddressColumn = (config?: HeaderConfig) => useCollapsedListColumn({ headerIcon: 'fa:at', ...config })
