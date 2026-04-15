import type { ReglePartialRuleTree } from '@regle/core'
import type { ComputedRef } from 'vue'

/**
 * Rules for a single validation pass (errors or warnings).
 * Accepts either a plain rules object or a getter function (for reactive locale-aware messages).
 */
export type FormValidationRules<TData extends Record<string, unknown>> =
  | ReglePartialRuleTree<TData>
  | (() => ReglePartialRuleTree<TData>)

/**
 * Controls when validation messages become visible.
 * - 'blur'   → messages shown when the user leaves a field (handleBlur is called)
 * - 'submit' → messages shown only when validate() is called
 */
export type FormBlurBehavior = 'blur' | 'submit'

/**
 * Configuration object for useFormValidation.
 */
export type FormValidationConfig<TData extends Record<string, unknown>> = {
  errors: FormValidationRules<TData>
  warnings?: FormValidationRules<TData>
  /**
   * Defaults: errors → 'submit', warnings → 'blur'
   */
  showOn?: {
    errors?: FormBlurBehavior
    warnings?: FormBlurBehavior
  }
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
   * Marks a single field as dirty according to the `showOn` config.
   * Call this on field blur for fields that have validation rules.
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
