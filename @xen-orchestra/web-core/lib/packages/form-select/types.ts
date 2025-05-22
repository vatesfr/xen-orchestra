import type { CollectionItem, CollectionItemProperties } from '@core/packages/collection'
import type { KeyOfByValue } from '@core/types/utility.type.ts'
import type { ComputedRef, InjectionKey, Reactive, Ref, UnwrapRef } from 'vue'

export type FormSelectId<
  TCustomProperties extends CollectionItemProperties = CollectionItemProperties,
  TSource = unknown,
  TValue = unknown,
  TMultiple extends boolean = boolean,
> = InjectionKey<FormSelect<TCustomProperties, TSource, TValue, TMultiple>>

export type FormSelectIdToOption<TSelectId extends FormSelectId> =
  TSelectId extends FormSelectId<infer TCustomProperties, infer TSource, infer TValue>
    ? FormOption<TCustomProperties, TSource, TValue>
    : never

export type ExtractValue<TOptionSource, TGetValue> = TGetValue extends keyof TOptionSource
  ? TOptionSource[TGetValue]
  : TGetValue extends (source: TOptionSource) => infer R
    ? R
    : TOptionSource

export type FormOptionCollectionItemProperties<TCustomProperties extends CollectionItemProperties, TValue> = {
  value: ComputedRef<TValue>
  label: ComputedRef<string>
  selectedLabel: ComputedRef<string | undefined>
  disabled: ComputedRef<boolean>
  matching: ComputedRef<boolean>
} & TCustomProperties

export type FormOption<
  TCustomProperties extends CollectionItemProperties = CollectionItemProperties,
  TSource = any,
  TValue = any,
> = CollectionItem<TSource, 'selected' | 'active', FormOptionCollectionItemProperties<TCustomProperties, TValue>>

export type FormOptionIndex =
  | number
  | 'previous'
  | 'next'
  | 'previous-page'
  | 'next-page'
  | 'first'
  | 'last'
  | 'selected'

export type FormSelectController = Reactive<{
  isDisabled: ComputedRef<boolean>
  isMultiple: ComputedRef<boolean>
  isNavigatingWithKeyboard: Ref<boolean>
  closeDropdown(keepFocus: boolean): void
  focusSearchOrTrigger(): void
}>

export const IK_FORM_SELECT_CONTROLLER = Symbol('IK_FORM_SELECT_CONTROLLER') as InjectionKey<FormSelectController>

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

export type FormSelect<
  TCustomProperties extends CollectionItemProperties = CollectionItemProperties,
  TSource = unknown,
  TValue = unknown,
  TMultiple extends boolean = boolean,
  TFormOption extends FormOption<TCustomProperties, TSource, TValue> = FormOption<TCustomProperties, TSource, TValue>,
> = {
  isMultiple: ComputedRef<TMultiple>
  isDisabled: ComputedRef<boolean>
  isRequired: ComputedRef<boolean>
  isSearchable: ComputedRef<boolean>
  isLoading: ComputedRef<boolean>
  placeholder: ComputedRef<string>
  searchPlaceholder: ComputedRef<string>
  searchTerm: Ref<string>
  allOptions: ComputedRef<TFormOption[]>
  options: ComputedRef<TFormOption[]>
  selectedLabel: ComputedRef<string>
} & (TMultiple extends true
  ? {
      selectedValues: ComputedRef<UnwrapRef<TValue>[]>
      selectedOptions: ComputedRef<TFormOption[]>
    }
  : {
      selectedValue: ComputedRef<UnwrapRef<TValue>>
      selectedOption: ComputedRef<TFormOption>
    })

export type UseFormSelectReturn<
  TCustomProperties extends CollectionItemProperties,
  TSource,
  TValue,
  TMultiple extends boolean,
  $TSelect extends FormSelect<TCustomProperties, TSource, TValue, TMultiple> = FormSelect<
    TCustomProperties,
    TSource,
    TValue,
    TMultiple
  >,
> = $TSelect & {
  id: FormSelectId<TCustomProperties, TSource, TValue, TMultiple>
}

export type GetOptionValue<TSource, TCustomProperties extends CollectionItemProperties> =
  | undefined
  | keyof TSource
  | ((source: TSource, properties: TCustomProperties) => unknown)

export type GetOptionLabel<TSource, TCustomProperties extends CollectionItemProperties> =
  | undefined
  | KeyOfByValue<TSource, string>
  | ((source: TSource, properties: TCustomProperties) => string)
