import type { FormFieldMessages, FormFieldMetadata, FormValidationConfig, UseFormValidationReturn } from './types.ts'
import type { ReglePartialRuleTree } from '@regle/core'
import { useRegle } from '@regle/core'
import { computed } from 'vue'

/**
 * Internal accessor type that describes the minimal Regle status API we rely on.
 * Using this instead of the full (and very complex) Regle generic types keeps the
 * wrapper's implementation readable while staying free of `any`.
 */
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
  rules: FormValidationConfig<TData>['errors']
): FormValidationConfig<TData>['errors'] {
  const arrayKeys = Object.keys(data).filter(key => Array.isArray(data[key]))

  if (arrayKeys.length === 0) {
    return rules
  }

  const inject = (ruleTree: ReglePartialRuleTree<TData>): ReglePartialRuleTree<TData> => {
    const result = { ...ruleTree } as Record<string, unknown>

    for (const key of arrayKeys) {
      const fieldRules = result[key]

      if (fieldRules !== null && typeof fieldRules === 'object' && !('$each' in fieldRules)) {
        result[key] = { ...(fieldRules as object), $each: {} }
      }
    }

    return result as ReglePartialRuleTree<TData>
  }

  if (typeof rules === 'function') {
    return () => inject((rules as () => ReglePartialRuleTree<TData>)())
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
  rules: FormValidationConfig<TData>['errors']
): { r$: unknown } {
  return (useRegle as unknown as (_data: TData, _rules: FormValidationConfig<TData>['errors']) => { r$: unknown })(
    data,
    rules
  )
}

function toMessage(fieldErrors: unknown): string | undefined {
  const [firstMessage] = fieldErrors as string[]

  return firstMessage
}

function buildMessages<TData extends Record<string, unknown>>(regle: RegleStatusAccessor): FormFieldMessages<TData> {
  return Object.fromEntries(
    Object.keys(regle.$fields).map(key => [key, toMessage(regle.$errors[key])])
  ) as FormFieldMessages<TData>
}

export function useFormValidation<TData extends Record<string, unknown>>(
  data: TData,
  config: FormValidationConfig<TData>
): UseFormValidationReturn<TData> {
  // Both useRegle calls must be unconditional — Vue composables cannot be called conditionally.
  // When no warnings rules are provided, an empty rules object produces an empty $fields map,
  // which means warnings will always be an empty record.
  // injectCollectionMarkers ensures array fields always have $each declared so Regle produces
  // the { $self, $each } error shape.
  const { r$ } = callUseRegle(data, injectCollectionMarkers(data, config.errors))
  const { r$: w$ } = callUseRegle(
    data,
    injectCollectionMarkers(data, config.warnings ?? ({} as ReglePartialRuleTree<TData>))
  )

  // Cast at the Regle boundary: Regle's inferred types are too complex to thread through
  // generics here, but the runtime shape is always compatible with RegleStatusAccessor.
  const errorRegle = r$ as RegleStatusAccessor
  const warningRegle = w$ as RegleStatusAccessor

  const errors = computed<FormFieldMessages<TData>>(() => buildMessages<TData>(errorRegle))

  const warnings = computed<FormFieldMessages<TData>>(() => buildMessages<TData>(warningRegle))

  async function validate(): Promise<boolean> {
    // Touch all warning fields first so out-of-range values become visible even if never blurred.
    warningRegle.$touch()

    const { valid } = await errorRegle.$validate()

    return valid
  }

  function reset(): void {
    errorRegle.$reset()
    warningRegle.$reset()
  }

  function handleBlur(field: keyof TData): void {
    const key = field as string
    // Evaluated at call time so the config object is always read fresh.
    if (config.showOn?.errors === 'blur') {
      errorRegle.$fields[key]?.$touch()
    }
    if (config.showOn?.warnings !== 'submit') {
      // Default: 'blur' — touch warning fields on every blur.
      warningRegle.$fields[key]?.$touch()
    }
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
