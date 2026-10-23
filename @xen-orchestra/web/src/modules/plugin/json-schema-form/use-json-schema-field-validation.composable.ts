import type { JsonSchemaPath } from '@/modules/plugin/json-schema-form/json-schema-validation.util.ts'
import { IK_JSON_SCHEMA_FORM } from '@/modules/plugin/json-schema-form/use-json-schema-form.composable.ts'
import type { InputWrapperMessage } from '@core/components/input-wrapper/VtsInputWrapper.vue'
import { toComputed } from '@core/utils/to-computed.util.ts'
import { computed, inject, type MaybeRefOrGetter } from 'vue'
import { useI18n } from 'vue-i18n'

export function useJsonSchemaFieldValidation(rawPath: MaybeRefOrGetter<JsonSchemaPath>) {
  const path = toComputed(rawPath)

  // undefined when the field is used outside of a form
  const form = inject(IK_JSON_SCHEMA_FORM, undefined)

  const { t } = useI18n()

  const fieldId = computed(() => form?.getFieldId(path.value))

  const errorMessage = computed(() =>
    form?.hasVisibleError(path.value)
      ? ({ content: t('form:error:required'), accent: 'danger' } satisfies InputWrapperMessage)
      : undefined
  )

  const errorCount = computed(() => form?.countVisibleErrors(path.value) ?? 0)

  function touch() {
    form?.touch(path.value)
  }

  return { fieldId, errorMessage, errorCount, touch }
}
