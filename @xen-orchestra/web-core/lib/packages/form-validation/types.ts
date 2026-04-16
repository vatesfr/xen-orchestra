import type { FormRuleDeclaration } from '@regle/core'
import type { ComputedRef } from 'vue'

// ---------------------------------------------------------------------------
// Per-field rule value type
// ---------------------------------------------------------------------------

/**
 * Accepted value for any rule entry: a Regle rule, a `withMessage(…)` wrapper,
 * or an inline `(value) => boolean` function.
 */
// FormRuleDeclaration<unknown> covers built-in Regle rules (required, minLength, …) which are
// universally typed with `unknown` internally. Listing it explicitly alongside FormRuleDeclaration<T>
// keeps inline-function completions typed with T while accepting built-in rules.
type AnyRuleValue<T> = FormRuleDeclaration<T> | FormRuleDeclaration<unknown> | undefined

// ---------------------------------------------------------------------------
// Built-in rule keys grouped by the value type they apply to
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Public rule tree types
// ---------------------------------------------------------------------------

/**
 * Typed rule object for a single form field.
 *
 * Known built-in rule keys are suggested by the IDE and automatically filtered by
 * the field's value type (e.g. `minValue` / `integer` for numbers, `email` / `url`
 * for strings, `checked` for booleans).
 *
 * Custom rule names (e.g. `outOfRange`) are freely allowed via the index signature —
 * they still compile without any type error.
 *
 * Every value accepts a Regle rule directly, a `withMessage(…)` wrapper, or an
 * inline `(value) => boolean` function.
 */
export type FormFieldRules<T> = UniversalRuleKeys<T> &
  StringRuleKeys<T> &
  NumberRuleKeys<T> &
  BooleanRuleKeys<T> &
  DateRuleKeys<T> & {
    [customRule: string]: AnyRuleValue<T>
  }

/**
 * Maps every key of TData to its typed rule object.
 * TypeScript resolves this shallowly, enabling IDE autocomplete at the rule level.
 */
export type FormRuleTree<TData extends Record<string, unknown>> = {
  [K in keyof TData]?: FormFieldRules<TData[K]>
}

/**
 * Rules for a single validation pass (errors or warnings).
 * Accepts either a plain rules object or a getter function (for reactive locale-aware messages).
 */
export type FormValidationRules<TData extends Record<string, unknown>> =
  | FormRuleTree<TData>
  | (() => FormRuleTree<TData>)

/**
 * Rule groups keyed by when they become visible:
 * - `onBlur`   → shown when the user leaves a field (`handleBlur` is called)
 * - `onSubmit` → shown only when `validate()` is called
 *
 * Both groups are optional. A field can have different rules in each group — for example,
 * `required` in `submit` (avoid showing the error while the user is still filling in the form)
 * and a range check in `blur` (immediate feedback as soon as the user leaves the field).
 */
export type FormValidationRuleGroup<TData extends Record<string, unknown>> = {
  onBlur?: FormValidationRules<TData>
  onSubmit?: FormValidationRules<TData>
}

/**
 * Configuration object for useFormValidation.
 */
export type FormValidationConfig<TData extends Record<string, unknown>> = {
  errors?: FormValidationRuleGroup<TData>
  warnings?: FormValidationRuleGroup<TData>
}

/**
 * Per-field messages, keyed by the form data properties.
 * Each value is the raw message string, or `undefined` when there is no active message.
 * Constructing UI-layer message objects (e.g. with an `accent`) is the consumer's responsibility.
 */
export type FormFieldMessages<TData extends Record<string, unknown>> = {
  [K in keyof TData]: string | undefined
}

/**
 * The base shape returned by useFieldMetadata.
 * Includes error, warning, and the blur handler so consumers never wire them manually.
 */
export type FormFieldMetadata = {
  error: string | undefined
  warning: string | undefined
  onBlur: () => void
}

export type UseFormValidationReturn<TData extends Record<string, unknown>> = {
  /**
   * Reactive blocking validation messages (accent: 'danger').
   * A field is populated only after it has been touched or `validate()` was called.
   */
  errors: ComputedRef<FormFieldMessages<TData>>

  /**
   * Reactive non-blocking validation messages (accent: 'warning').
   * A field is populated after `handleBlur(field)` or `validate()` was called.
   */
  warnings: ComputedRef<FormFieldMessages<TData>>

  /**
   * Triggers all warning fields, validates all error fields, and returns whether the form is valid.
   * Call this on form submit.
   */
  validate: () => Promise<boolean>

  /**
   * Resets both error and warning validation state (dirty flags, messages).
   */
  reset: () => void

  /**
   * Marks a field dirty in the blur-triggered rule groups (`errors.blur` and `warnings.blur`).
   * Call this on field blur for fields that have blur rules.
   */
  handleBlur: (field: keyof TData) => void

  /**
   * Returns a metadata factory for the given field, ready to pass as useField's second argument.
   * Bundles error, warning, and the blur handler. Accepts an optional extras factory to merge
   * additional props (e.g. label, required) without double-call syntax.
   */
  useFieldMetadata: {
    (field: keyof TData): () => FormFieldMetadata
    <E extends Record<string, unknown>>(field: keyof TData, extras: () => E): () => FormFieldMetadata & E
  }
}
