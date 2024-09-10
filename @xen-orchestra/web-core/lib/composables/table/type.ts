import type { StringKeyOf } from '@core/types/utility.type'
import type { ComputedRef, UnwrapRef } from 'vue'

export type CompareFn<TValue, TCompareReturn> = (a: TValue, b: TValue) => TCompareReturn

type Getter<TRecord, TValue> = (item: TRecord) => TValue

export type ColumnOptions<TValue, THideable extends boolean | unknown, TCompareReturn extends number | unknown> = {
  label: string
  isHideable?: THideable
  compareFn?: CompareFn<TValue, TCompareReturn>
}

export type BaseDefinition<TId, TRecord, TValue> = {
  id: TId
  label: string
  getter: Getter<TRecord, TValue>
}

export type VisibilityDefinition<THideable extends boolean | unknown> = THideable extends false
  ? {
      isHideable: false
      isVisible: true
    }
  : {
      isHideable: true
      isVisible: ComputedRef<boolean>
      show(): void
      hide(): void
      toggle(value?: boolean): void
    }

export type SortingDefinition<TValue, TCompareReturn extends number | unknown> = TCompareReturn extends number
  ? {
      isSortable: true
      isSorted: ComputedRef<boolean>
      isSortedAsc: ComputedRef<boolean>
      isSortedDesc: ComputedRef<boolean>
      sort(direction: 'asc' | 'desc' | false, toggleOffIfSameDirection?: boolean): void
      sortAsc(toggleOffIfSameDirection?: boolean): void
      sortDesc(toggleOffIfSameDirection?: boolean): void
      compareFn: (a: TValue, b: TValue) => TCompareReturn
    }
  : {
      isSortable: false
    }

export type ColumnDefinition<
  TId,
  TRecord,
  TValue,
  THideable extends boolean | unknown,
  TCompareReturn extends number | unknown,
> = UnwrapRef<
  BaseDefinition<TId, TRecord, TValue> & VisibilityDefinition<THideable> & SortingDefinition<TValue, TCompareReturn>
>

export type DefineColumn<TRecord> = {
  <
    const TId extends StringKeyOf<TRecord>,
    TCompareReturn extends number | unknown,
    THideable extends boolean | unknown,
  >(
    columnId: TId,
    options: ColumnOptions<TRecord[TId], THideable, TCompareReturn>
  ): ColumnDefinition<TId, TRecord, TRecord[TId], THideable, TCompareReturn>

  <
    const TId extends string,
    TProperty extends keyof TRecord,
    TCompareReturn extends number | unknown,
    THideable extends boolean | unknown,
  >(
    columnId: TId,
    property: TProperty,
    options: ColumnOptions<TRecord[TProperty], THideable, TCompareReturn>
  ): ColumnDefinition<TId, TRecord, TRecord[TProperty], THideable, TCompareReturn>

  <const TId extends string, TOutput, TCompareReturn extends number | unknown, THideable extends boolean | unknown>(
    columnId: TId,
    getter: Getter<TRecord, TOutput>,
    options: ColumnOptions<TOutput, THideable, TCompareReturn>
  ): ColumnDefinition<TId, TRecord, TOutput, THideable, TCompareReturn>
}

export type TableOptions<TRecord, TRowId, TDefinition extends ColumnDefinition<any, any, any, any, any>> = {
  rowId: (item: TRecord) => TRowId
  columns: (define: DefineColumn<TRecord>) => TDefinition[]
}

export type RowColumn<TColumnDefinition extends ColumnDefinition<any, any, any, any, any>> =
  TColumnDefinition extends ColumnDefinition<infer TColumnId, any, infer TColumnValue, any, any>
    ? {
        id: TColumnId
        value: TColumnValue
      }
    : never

export type Row<TRowId, TDefinitions extends ColumnDefinition<any, any, any, any, any>[]> = {
  id: TRowId
  value: TDefinitions extends ColumnDefinition<any, infer TRecord, any, any, any> ? TRecord : never
  visibleColumns: { [TIndex in keyof TDefinitions]: RowColumn<TDefinitions[TIndex]> }
}

export type Table<TRowId, TDefinitions extends ColumnDefinition<any, any, any, any, any>[]> = {
  columns: ComputedRef<TDefinitions>
  visibleColumns: ComputedRef<TDefinitions[number][]>
  columnsById: ComputedRef<{
    [TColumn in TDefinitions[number] as TColumn['id']]: TColumn
  }>
  rows: ComputedRef<Row<TRowId, TDefinitions>[]>
}
