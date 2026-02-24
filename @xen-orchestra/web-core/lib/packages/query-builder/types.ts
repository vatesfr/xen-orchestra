import type { Reactive, Ref, ComputedRef } from 'vue'

export type GroupOperator = 'and' | 'or'

export type PropertyOperator =
  | 'contains'
  | 'doesNotContain'
  | 'is'
  | 'isNot'
  | 'startsWith'
  | 'doesNotStartWith'
  | 'endsWith'
  | 'doesNotEndWith'
  | 'matchesRegex'
  | 'doesNotMatchRegex'
  | 'matchesGlob'
  | 'doesNotMatchGlob'
  | 'greaterThan'
  | 'greaterThanOrEqual'
  | 'lessThan'
  | 'lessThanOrEqual'
  | 'isEmpty'
  | 'isNotEmpty'

export type OperatorsDefinition = {
  [K in PropertyOperator]?:
    | {
        label: string
        values?: Record<string, string>
        expectValue?: never
      }
    | {
        label: string
        values?: never
        expectValue?: boolean
      }
}

export type PropertyDefinition = {
  label: string
  operators: OperatorsDefinition
}

export type PropertyPath<T> = T extends string | number | boolean | Date | any[]
  ? never
  : {
      [K in keyof T & string]: `${K}` | `${K}:${PropertyPath<T[K]>}`
    }[keyof T & string]

export type QueryBuilderSchemaInput<TSource> = {
  '': PropertyDefinition
} & {
  [K in PropertyPath<TSource>]?: PropertyDefinition
}

export type ValueSchema = {
  label: string
  value: string
}

export type OperatorSchema = {
  label: string
  operator: PropertyOperator
  expectValue: boolean
  values: Record<string, ValueSchema> | undefined
}

export type PropertySchema = {
  label: string
  property: string
  operators: Record<string, OperatorSchema>
}

export type QueryBuilderSchema = Record<string, PropertySchema>

export type QueryBuilderGroup = Reactive<{
  id: string
  operator: Ref<GroupOperator>
  children: Ref<QueryBuilderNode[]>
  isGroup: true
  rawFilter: ComputedRef<string>
  addChildFilter: () => void
  addChildGroup: () => void
  duplicateChild: (childIndex: number) => void
  removeChild: (index: number, keepChildren?: boolean) => void
  wrapInGroup: () => void
  convertChildToGroup: (childIndex: number) => void
  schema: QueryBuilderSchema
}>

export type QueryBuilderFilter = Reactive<{
  id: string
  property: Ref<string | undefined>
  operator: Ref<PropertyOperator | undefined>
  value: Ref<any>
  isGroup: false
  rawFilter: ComputedRef<string>
  propertyOptions: ComputedRef<PropertySchema[]>
  operatorOptions: ComputedRef<OperatorSchema[]>
  valueOptions: ComputedRef<ValueSchema[]>
  isValid: ComputedRef<boolean>
  valueType: ComputedRef<'input' | 'select' | 'none'>
}>

export type QueryBuilderNode = QueryBuilderGroup | QueryBuilderFilter

export type UseQueryBuilderReturn = {
  rootGroup: Ref<QueryBuilderGroup>
  isUsable: ComputedRef<boolean>
  updateFilter: () => void
  resetFilter: () => void
}

export type QueryBuilderConfig = {
  property: string
  operator: PropertyOperator
  value: string
  schema: QueryBuilderSchema
}
