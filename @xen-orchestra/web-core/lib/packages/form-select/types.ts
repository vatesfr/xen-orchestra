import type { CollectionConfigProperties, CollectionItem } from '@core/packages/collection'
import type { MaybeArray } from '@core/types/utility.type.ts'
import type { ComputedRef, InjectionKey, Reactive, WritableComputedRef } from 'vue'

export type FormSelectBaseConfig = {
  multiple?: boolean
  selectedLabel?: (count: number, labels: string[]) => string | undefined
}

export type FormSelectBaseProperties = Record<string, unknown> & {
  disabled?: boolean
  searchableTerm?: MaybeArray<string>
}

export type FormOptionValue = string | number

export type FormOptionProperties<TValue extends FormOptionValue> = {
  id: TValue
  label: string
  multiple: boolean
  disabled: boolean
  matching: boolean
}

export type FormOption<
  TSource = unknown,
  TValue extends FormOptionValue = FormOptionValue,
  TProperties extends CollectionConfigProperties = CollectionConfigProperties,
> = CollectionItem<TSource, 'active' | 'selected', TProperties & FormOptionProperties<TValue>>

export type UseFormSelectReturn<
  TSource,
  TValue extends FormOptionValue,
  TProperties extends CollectionConfigProperties,
> = {
  searchTerm: WritableComputedRef<string>
  allOptions: ComputedRef<FormOption<TSource, TValue, TProperties>[]>
  options: ComputedRef<FormOption<TSource, TValue, TProperties>[]>
  selectedOptions: ComputedRef<FormOption<TSource, TValue, TProperties>[]>
  selectedValues: ComputedRef<TValue[]>
  selectedLabel: ComputedRef<string>
}

export type FormOptionIndex =
  | number
  | 'previous'
  | 'next'
  | 'previous-page'
  | 'next-page'
  | 'first'
  | 'last'
  | 'selected'

export enum FORM_SELECT_HANDLED_KEY {
  DOWN = 'ArrowDown',
  UP = 'ArrowUp',
  LEFT = 'ArrowLeft',
  RIGHT = 'ArrowRight',
  ENTER = 'Enter',
  SPACE = ' ',
  ESCAPE = 'Escape',
  HOME = 'Home',
  END = 'End',
  TAB = 'Tab',
  PAGE_DOWN = 'PageDown',
  PAGE_UP = 'PageUp',
}

export type FormSelectController = Reactive<{
  isNavigatingWithKeyboard: boolean
  closeDropdown(keepFocus: boolean): void
  focusSearchOrTrigger(): void
}>

export const IK_FORM_SELECT_CONTROLLER = Symbol('IK_FORM_SELECT_CONTROLLER') as InjectionKey<FormSelectController>
