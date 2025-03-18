import type { InjectionKey, Reactive } from 'vue'

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

export type FormOptionValue = string | number

export type FormOptionIndex =
  | number
  | 'previous'
  | 'next'
  | 'previous-page'
  | 'next-page'
  | 'first'
  | 'last'
  | 'selected'

export type FormOption<TData> = {
  value: FormOptionValue
  data: TData
  label?: string
  disabled?: boolean
}

export type FormSelectController = Reactive<{
  isMultiple: boolean
  isNavigatingWithKeyboard: boolean
  isOptionActive(value: FormOptionValue): boolean
  isOptionSelected(value: FormOptionValue): boolean
  selectOption(value: FormOptionValue): void
  toggleOption(value: FormOptionValue): void
  moveToOption(value: FormOptionValue): void
  closeDropdown(keepFocus: boolean): void
  focusSearch(): void
}>

export const IK_FORM_SELECT_CONTROLLER = Symbol('IK_FORM_SELECT_CONTROLLER') as InjectionKey<FormSelectController>
