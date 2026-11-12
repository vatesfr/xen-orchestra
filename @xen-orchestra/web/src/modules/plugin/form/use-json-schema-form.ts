import { useJsonSchemaItemLabel } from '@/modules/plugin/composables/use-json-schema-item-label.composable.ts'
import { useJsonSchemaNestedLabel } from '@/modules/plugin/composables/use-json-schema-nested-label.composable.ts'
import {
  getInvalidFields,
  isPathWithin,
  type JsonSchemaFieldError,
  type JsonSchemaPath,
  toPathKey,
} from '@/modules/plugin/utils/json-schema-validation.util.ts'
import type { JsonSchema } from '@/modules/plugin/utils/json-schema.util.ts'
import type { FormErrorSummaryItem } from '@core/components/form-error-summary/VtsFormErrorSummary.vue'
import { focusField } from '@core/utils/focus-field.util.ts'
import { toComputed } from '@core/utils/to-computed.util.ts'
import { computed, type InjectionKey, type MaybeRefOrGetter, provide, reactive, ref, useId } from 'vue'
import { useI18n } from 'vue-i18n'

export type JsonSchemaFormError = FormErrorSummaryItem & {
  path: JsonSchemaPath
  // shown under the field, while `message` names the field in the summary
  fieldMessage: string
}

type JsonSchemaFormContext = {
  getFieldId: (path: JsonSchemaPath) => string
  getVisibleError: (path: JsonSchemaPath) => JsonSchemaFormError | undefined
  countVisibleErrors: (path: JsonSchemaPath) => number
  touch: (path: JsonSchemaPath) => void
}

export const IK_JSON_SCHEMA_FORM = Symbol('IK_JSON_SCHEMA_FORM') as InjectionKey<JsonSchemaFormContext>

export function useJsonSchemaForm(
  rawSchema: MaybeRefOrGetter<JsonSchema | undefined>,
  rawValue: MaybeRefOrGetter<unknown>
) {
  const schema = toComputed(rawSchema)
  const value = toComputed(rawValue)

  const { t } = useI18n()

  const getItemLabel = useJsonSchemaItemLabel()

  const getNestedLabel = useJsonSchemaNestedLabel()

  const formId = useId()

  const isSubmitted = ref(false)

  const touchedPathKeys = reactive(new Set<string>())

  function getFieldId(path: JsonSchemaPath) {
    return `${formId}-${toPathKey(path)}`
  }

  function getErrorMessages(error: JsonSchemaFieldError, field: string) {
    switch (error.rule) {
      case 'required':
        return { fieldMessage: t('form:error:required'), message: t('form:error:field-required', { field }) }
      case 'integer':
        return { fieldMessage: t('form:error:integer'), message: t('form:error:field-integer', { field }) }
      case 'minimum':
        return {
          fieldMessage: t('form:error:minimum', { min: error.limit }),
          message: t('form:error:field-minimum', { field, min: error.limit }),
        }
      case 'maximum':
        return {
          fieldMessage: t('form:error:maximum', { max: error.limit }),
          message: t('form:error:field-maximum', { field, max: error.limit }),
        }
      case 'min-items':
        return {
          fieldMessage: t('form:error:min-items', { n: error.limit }, error.limit),
          message: t('form:error:field-min-items', { field, n: error.limit }, error.limit),
        }
    }
  }

  const errors = computed<JsonSchemaFormError[]>(() => {
    if (schema.value === undefined) {
      return []
    }

    return getInvalidFields(schema.value, value.value, { getItemLabel }).map(({ path, labels, error }) => ({
      path,
      id: getFieldId(path),
      ...getErrorMessages(error, getNestedLabel(labels)),
    }))
  })

  const summaryErrors = computed(() => (isSubmitted.value ? errors.value : []))

  const visibleErrors = computed(() =>
    isSubmitted.value ? errors.value : errors.value.filter(error => touchedPathKeys.has(toPathKey(error.path)))
  )

  const visibleErrorsByPathKey = computed(
    () => new Map(visibleErrors.value.map(error => [toPathKey(error.path), error]))
  )

  function submit() {
    isSubmitted.value = true

    const firstError = errors.value[0]

    if (firstError === undefined) {
      return true
    }

    focusField(firstError.id)

    return false
  }

  function reset() {
    isSubmitted.value = false
    touchedPathKeys.clear()
  }

  provide(IK_JSON_SCHEMA_FORM, {
    getFieldId,
    getVisibleError: path => visibleErrorsByPathKey.value.get(toPathKey(path)),
    countVisibleErrors: path => visibleErrors.value.filter(error => isPathWithin(error.path, path)).length,
    touch: path => {
      touchedPathKeys.add(toPathKey(path))
    },
  })

  return { errors, summaryErrors, submit, reset }
}
