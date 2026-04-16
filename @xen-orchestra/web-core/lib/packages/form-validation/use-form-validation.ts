import type {
  FormFieldMessages,
  FormFieldMetadata,
  FormRuleTree,
  FormValidationConfig,
  FormValidationRules,
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
 * Automatically injects `$each: {}` into the rule tree for every field whose
 * current value is an array, if that field is present in the rules but has no
 * `$each` declared yet.
 *
 * This is required because Regle needs `$each` to know a field is a collection
 * and to produce the `{ $self, $each }` error shape instead of a flat string[].
 */
function injectCollectionMarkers<TData extends Record<string, unknown>>(
  data: TData,
  rules: FormValidationRules<TData>
): FormValidationRules<TData> {
  const arrayKeys = Object.keys(data).filter(key => Array.isArray(data[key]))

  if (arrayKeys.length === 0) {
    return rules
  }

  const inject = (ruleTree: FormRuleTree<TData>): FormRuleTree<TData> => {
    const result = { ...ruleTree } as Record<string, unknown>

    for (const key of arrayKeys) {
      const fieldRules = result[key]

      if (fieldRules !== null && typeof fieldRules === 'object' && !('$each' in fieldRules)) {
        result[key] = { ...(fieldRules as object), $each: {} }
      }
    }

    return result as FormRuleTree<TData>
  }

  if (typeof rules === 'function') {
    return () => inject((rules as () => FormRuleTree<TData>)())
  }

  return inject(rules)
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
  const [firstMessage] = fieldErrors as string[]

  return firstMessage
}

function buildMessages(regle: RegleStatusAccessor): Record<string, string | undefined> {
  return Object.fromEntries(Object.keys(regle.$fields).map(key => [key, toMessage(regle.$errors[key])]))
}

function mergeMessages(
  a: Record<string, string | undefined>,
  b: Record<string, string | undefined>
): Record<string, string | undefined> {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)])

  return Object.fromEntries([...keys].map(key => [key, a[key] ?? b[key]]))
}

const EMPTY_RULES = {}

export function useFormValidation<TData extends Record<string, unknown>>(
  data: TData,
  config: FormValidationConfig<TData>
): UseFormValidationReturn<TData> {
  // All four useRegle calls must be unconditional — Vue composables cannot be called conditionally.
  // When a group has no rules, an empty rule tree produces an empty $fields map.
  // injectCollectionMarkers ensures array fields always have $each declared so Regle produces
  // the { $self, $each } error shape.
  const { r$: blurErrors$ } = callUseRegle(data, injectCollectionMarkers(data, config.errors?.onBlur ?? EMPTY_RULES))
  const { r$: submitErrors$ } = callUseRegle(
    data,
    injectCollectionMarkers(data, config.errors?.onSubmit ?? EMPTY_RULES)
  )
  const { r$: blurWarnings$ } = callUseRegle(
    data,
    injectCollectionMarkers(data, config.warnings?.onBlur ?? EMPTY_RULES)
  )
  const { r$: submitWarnings$ } = callUseRegle(
    data,
    injectCollectionMarkers(data, config.warnings?.onSubmit ?? EMPTY_RULES)
  )

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
