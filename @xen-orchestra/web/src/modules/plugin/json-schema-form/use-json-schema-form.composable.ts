import { focusField } from '@/modules/plugin/json-schema-form/focus-field.util.ts'
import {
  getMissingFields,
  isPathWithin,
  type JsonSchemaPath,
  toPathKey,
} from '@/modules/plugin/json-schema-form/json-schema-validation.util.ts'
import type { JsonSchema } from '@/modules/plugin/json-schema-form/json-schema.util.ts'
import { useJsonSchemaItemLabel } from '@/modules/plugin/json-schema-form/use-json-schema-item-label.composable.ts'
import { toComputed } from '@core/utils/to-computed.util.ts'
import { computed, type InjectionKey, type MaybeRefOrGetter, provide, reactive, ref, useId } from 'vue'
import { useI18n } from 'vue-i18n'

export type JsonSchemaFormError = {
  path: JsonSchemaPath
  id: string
  label: string
}

type JsonSchemaFormContext = {
  getFieldId: (path: JsonSchemaPath) => string
  /** whether the field is required and missing, once the user has left it or tried to submit the form */
  hasVisibleError: (path: JsonSchemaPath) => boolean
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

  const formId = useId()

  const isSubmitted = ref(false)

  const touchedPathKeys = reactive(new Set<string>())

  function getFieldId(path: JsonSchemaPath) {
    return `${formId}-${toPathKey(path)}`
  }

  const errors = computed<JsonSchemaFormError[]>(() => {
    if (schema.value === undefined) {
      return []
    }

    return getMissingFields(schema.value, value.value, { getItemLabel }).map(({ path, labels }) => ({
      path,
      id: getFieldId(path),
      label: labels.reduce((parent, label) => t('json-schema:nested-label', { parent, label })),
    }))
  })

  const visibleErrors = computed(() =>
    isSubmitted.value ? errors.value : errors.value.filter(error => touchedPathKeys.has(toPathKey(error.path)))
  )

  const visibleErrorKeys = computed(() => new Set(visibleErrors.value.map(error => toPathKey(error.path))))

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
    hasVisibleError: path => visibleErrorKeys.value.has(toPathKey(path)),
    countVisibleErrors: path => visibleErrors.value.filter(error => isPathWithin(error.path, path)).length,
    touch: path => {
      touchedPathKeys.add(toPathKey(path))
    },
  })

  return { errors, isSubmitted, submit, reset }
}
