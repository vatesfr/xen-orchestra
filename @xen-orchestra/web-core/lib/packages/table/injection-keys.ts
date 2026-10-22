import type { ColumnSortContext } from '@core/packages/table/types.ts'
import type { InjectionKey } from 'vue'

export const IK_COLUMN_SORT = Symbol('IK_COLUMN_SORT') as InjectionKey<ColumnSortContext>
