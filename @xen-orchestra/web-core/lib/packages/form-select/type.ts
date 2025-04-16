import type { CollectionItem } from '@core/packages/collection'
import type { MaybeArray } from '@core/types/utility.type.ts'
import type { InjectionKey, Reactive } from 'vue'

export type FormOption<TEntry, TValue extends PropertyKey> = CollectionItem<
  TEntry,
  TValue,
  'selected' | 'active',
  {
    label: string
    matching: boolean
    disabled: boolean
    multiple: boolean
  }
>

export type UseFormOptionsConfig<TEntry, TValue extends PropertyKey> = {
  getValue: (entry: TEntry) => TValue
  getLabel: (entry: TEntry) => string
  getSearchableTerm?: (entry: TEntry) => MaybeArray<string>
  getDisabled?: (entry: TEntry) => boolean
  multiple?: boolean
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
