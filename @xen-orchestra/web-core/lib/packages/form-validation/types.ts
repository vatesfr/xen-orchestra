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
 * Per-field messages, keyed by the form data properties.
 * Each value is the raw message string, or `undefined` when there is no active message.
 * Constructing UI-layer message objects (e.g. with an `accent`) is the consumer's responsibility.
 */
export type FormFieldMessages<TData extends Record<string, unknown>> = {
  [K in keyof TData]?: string
}

export type UseFormValidationReturn<TData extends Record<string, unknown>> = {
  /**
   * Reactive blocking validation messages (accent: 'danger').
   * A field is populated only after it has been touched or `validate()` was called.
   */
  errors: ComputedRef<FormFieldMessages<TData>>

  /**
   * Reactive non-blocking validation messages (accent: 'warning').
   * A field is populated after `touch(field)` or `validate()` was called.
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
   * Marks a single field as dirty in the warning instance so its warning message becomes visible.
   * Call this on field blur for fields that have warning rules.
   */
  handleBlur: (field: keyof TData) => void
}
