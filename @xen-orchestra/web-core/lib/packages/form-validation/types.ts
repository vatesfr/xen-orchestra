import type { FormRuleDeclaration } from '@regle/core'
import type { ComputedRef } from 'vue'

// FormRuleDeclaration<unknown> covers built-in Regle rules (required, minLength, …) which are
// universally typed with `unknown` internally. Listing it explicitly alongside FormRuleDeclaration<T>
// keeps inline-function completions typed with T while accepting built-in rules.
type AnyRuleValue<T> = FormRuleDeclaration<T> | FormRuleDeclaration<unknown> | undefined

type UniversalRuleKeys<T> = {
  required?: AnyRuleValue<T>
  requiredIf?: AnyRuleValue<T>
  requiredUnless?: AnyRuleValue<T>
}

type StringRuleKeys<T> = [Extract<NonNullable<T>, string>] extends [never]
  ? Record<never, never>
  : {
      minLength?: AnyRuleValue<T>
      maxLength?: AnyRuleValue<T>
      email?: AnyRuleValue<T>
      url?: AnyRuleValue<T>
      httpUrl?: AnyRuleValue<T>
      regex?: AnyRuleValue<T>
      sameAs?: AnyRuleValue<T>
      contains?: AnyRuleValue<T>
      ipAddress?: AnyRuleValue<T>
      macAddress?: AnyRuleValue<T>
      alpha?: AnyRuleValue<T>
      alphaNum?: AnyRuleValue<T>
      numeric?: AnyRuleValue<T>
    }

type NumberRuleKeys<T> = [Extract<NonNullable<T>, number>] extends [never]
  ? Record<never, never>
  : {
      minValue?: AnyRuleValue<T>
      maxValue?: AnyRuleValue<T>
      integer?: AnyRuleValue<T>
      between?: AnyRuleValue<T>
    }

type BooleanRuleKeys<T> = [Extract<NonNullable<T>, boolean>] extends [never]
  ? Record<never, never>
  : {
      checked?: AnyRuleValue<T>
    }

type DateRuleKeys<T> = [Extract<NonNullable<T>, Date>] extends [never]
  ? Record<never, never>
  : {
      after?: AnyRuleValue<T>
      before?: AnyRuleValue<T>
      dateBetween?: AnyRuleValue<T>
      dateAfter?: AnyRuleValue<T>
      dateBefore?: AnyRuleValue<T>
    }

export type FormFieldRules<T> = UniversalRuleKeys<T> &
  StringRuleKeys<T> &
  NumberRuleKeys<T> &
  BooleanRuleKeys<T> &
  DateRuleKeys<T> & {
    [customRule: string]: AnyRuleValue<T>
  }

export type FormRuleTree<TData extends Record<string, unknown>> = {
  [K in keyof TData]?: FormFieldRules<TData[K]>
}

export type FormValidationRules<TData extends Record<string, unknown>> =
  | FormRuleTree<TData>
  | (() => FormRuleTree<TData>)

export type FormValidationRuleGroup<TData extends Record<string, unknown>> = {
  onBlur?: FormValidationRules<TData>
  onSubmit?: FormValidationRules<TData>
}

export type FormValidationConfig<TData extends Record<string, unknown>> = {
  errors?: FormValidationRuleGroup<TData>
  warnings?: FormValidationRuleGroup<TData>
}

export type FormFieldMessages<TData extends Record<string, unknown>> = {
  [K in keyof TData]: string | undefined
}

export type FormFieldMetadata = {
  error: string | undefined
  warning: string | undefined
  onBlur: () => void
}

export type UseFormValidationReturn<TData extends Record<string, unknown>> = {
  errors: ComputedRef<FormFieldMessages<TData>>
  warnings: ComputedRef<FormFieldMessages<TData>>
  validate: () => Promise<boolean>
  reset: () => void
  handleBlur: (field: keyof TData) => void
  useFieldMetadata: {
    (field: keyof TData): () => FormFieldMetadata
    <E extends Record<string, unknown>>(field: keyof TData, extras: () => E): () => FormFieldMetadata & E
  }
}
