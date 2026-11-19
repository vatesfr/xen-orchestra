import { IK_JSON_SCHEMA_FORM } from '@/modules/plugin/form/use-json-schema-form.ts'
import type { JsonSchemaPath } from '@/modules/plugin/utils/json-schema-validation.util.ts'
import type { InputWrapperMessage } from '@core/components/input-wrapper/VtsInputWrapper.vue'
import { toComputed } from '@core/utils/to-computed.util.ts'
import { computed, inject, type MaybeRefOrGetter } from 'vue'

export function useJsonSchemaFieldValidation(rawPath: MaybeRefOrGetter<JsonSchemaPath>) {
  const path = toComputed(rawPath)

  // undefined when the field is used outside of a form
  const form = inject(IK_JSON_SCHEMA_FORM, undefined)

  const fieldId = computed(() => form?.getFieldId(path.value))

  const errorMessage = computed(() => {
    const error = form?.getVisibleError(path.value)

    return error === undefined
      ? undefined
      : ({ content: error.fieldMessage, accent: 'danger' } satisfies InputWrapperMessage)
  })

  const errorCount = computed(() => form?.countVisibleErrors(path.value) ?? 0)

  function touch() {
    form?.touch(path.value)
  }

  return { fieldId, errorMessage, errorCount, touch }
}
