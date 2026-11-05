import type {
  FormFieldMessages,
  FormFieldMetadata,
  FormRuleTree,
  FormValidationConfig,
  UseFormValidationReturn,
} from './types.ts'
import { useRegle } from '@regle/core'
import { computed } from 'vue'

type FieldStatus = {
  $touch: () => void
}

type RegleStatusAccessor = {
  $fields: Record<string, FieldStatus>
  $errors: Record<string, unknown>
  $validate: () => Promise<{ valid: boolean }>
  $reset: () => void
  $touch: () => void
}

/**
 * Calls `useRegle` with a simplified signature.
 *
 * Regle's second-parameter type is a deeply conditional type that TypeScript cannot
 * resolve when `TData` is a generic type parameter. Casting through `unknown` at this
 * single call-site keeps the rest of the file type-safe without resorting to `any`.
 */
function callUseRegle<TData extends Record<string, unknown>>(
  data: TData,
  rules: FormRuleTree<TData> | (() => FormRuleTree<TData>)
): { r$: unknown } {
  return (
    useRegle as unknown as (_data: TData, _rules: FormRuleTree<TData> | (() => FormRuleTree<TData>)) => { r$: unknown }
  )(data, rules)
}

function toMessage(fieldErrors: unknown): string | undefined {
  if (Array.isArray(fieldErrors)) {
    return fieldErrors[0]
  }

  // Collection-field errors take the { $self: string[], $each: ... } shape: surface the first $self message.
  if (fieldErrors !== null && typeof fieldErrors === 'object' && '$self' in fieldErrors) {
    const $self = (fieldErrors as { $self?: unknown }).$self

    if (Array.isArray($self)) {
      return $self[0]
    }
  }

  return undefined
}

function buildMessages(regle: RegleStatusAccessor): Record<string, string | undefined> {
  return Object.fromEntries(Object.keys(regle.$fields).map(key => [key, toMessage(regle.$errors[key])]))
}

function mergeMessages(
  blurMessages: Record<string, string | undefined>,
  submitMessages: Record<string, string | undefined>
): Record<string, string | undefined> {
  const keys = new Set([...Object.keys(blurMessages), ...Object.keys(submitMessages)])

  return Object.fromEntries([...keys].map(key => [key, blurMessages[key] ?? submitMessages[key]]))
}

const EMPTY_RULES = {}

export function useFormValidation<TData extends Record<string, unknown>>(
  data: TData,
  config: FormValidationConfig<TData>
): UseFormValidationReturn<TData> {
  // All four useRegle calls must be unconditional — Vue composables cannot be called conditionally.
  // When a group has no rules, an empty rule tree produces an empty $fields map.
  const { r$: blurErrors$ } = callUseRegle(data, config.errors?.onBlur ?? EMPTY_RULES)
  const { r$: submitErrors$ } = callUseRegle(data, config.errors?.onSubmit ?? EMPTY_RULES)
  const { r$: blurWarnings$ } = callUseRegle(data, config.warnings?.onBlur ?? EMPTY_RULES)
  const { r$: submitWarnings$ } = callUseRegle(data, config.warnings?.onSubmit ?? EMPTY_RULES)

  // Cast at the Regle boundary: Regle's inferred types are too complex to thread through
  // generics here, but the runtime shape is always compatible with RegleStatusAccessor.
  const blurErrorRegle = blurErrors$ as RegleStatusAccessor
  const submitErrorRegle = submitErrors$ as RegleStatusAccessor
  const blurWarningRegle = blurWarnings$ as RegleStatusAccessor
  const submitWarningRegle = submitWarnings$ as RegleStatusAccessor

  const errors = computed<FormFieldMessages<TData>>(
    () => mergeMessages(buildMessages(blurErrorRegle), buildMessages(submitErrorRegle)) as FormFieldMessages<TData>
  )

  const warnings = computed<FormFieldMessages<TData>>(
    () => mergeMessages(buildMessages(blurWarningRegle), buildMessages(submitWarningRegle)) as FormFieldMessages<TData>
  )

  async function validate(): Promise<boolean> {
    // Touch all warning fields so advisory messages become visible regardless of which group they're in.
    blurWarningRegle.$touch()
    submitWarningRegle.$touch()

    const [blurResult, submitResult] = await Promise.all([blurErrorRegle.$validate(), submitErrorRegle.$validate()])

    return blurResult.valid && submitResult.valid
  }

  function reset(): void {
    blurErrorRegle.$reset()
    submitErrorRegle.$reset()
    blurWarningRegle.$reset()
    submitWarningRegle.$reset()
  }

  function handleBlur(field: keyof TData): void {
    const key = field as string
    // Only touch blur-group fields — submit-group fields stay hidden until validate() is called.
    blurErrorRegle.$fields[key]?.$touch()
    blurWarningRegle.$fields[key]?.$touch()
  }

  function useFieldMetadata(field: keyof TData): () => FormFieldMetadata
  function useFieldMetadata<E extends Record<string, unknown>>(
    field: keyof TData,
    extras: () => E
  ): () => FormFieldMetadata & E
  function useFieldMetadata<E extends Record<string, unknown> = Record<string, unknown>>(
    field: keyof TData,
    extras?: () => E
  ) {
    return () => ({
      error: errors.value[field],
      warning: warnings.value[field],
      onBlur: () => handleBlur(field),
      ...extras?.(),
    })
  }

  return {
    errors,
    warnings,
    validate,
    reset,
    handleBlur,
    useFieldMetadata,
  }
}
