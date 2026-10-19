<template>
  <JsonSchemaSelectField
    v-if="isReady"
    v-model="model"
    :options
    :label
    :description="description.text"
    :path
    :multiple
    :required
    :disabled
  />
  <VtsInputWrapper v-else :id="fieldId" :label :message wrap-message>
    <UiLoader v-if="!hasError" />
    <template #message="{ content }">
      <JsonSchemaText :text="content" />
    </template>
  </VtsInputWrapper>
</template>

<script lang="ts" setup>
import { getXoObjectReference } from '@/modules/plugin/json-schema-form/json-schema.util.ts'
import type { JsonSchemaFieldComponentProps } from '@/modules/plugin/json-schema-form/JsonSchemaField.vue'
import JsonSchemaSelectField from '@/modules/plugin/json-schema-form/JsonSchemaSelectField.vue'
import JsonSchemaText from '@/modules/plugin/json-schema-form/JsonSchemaText.vue'
import { useJsonSchemaFieldValidation } from '@/modules/plugin/json-schema-form/use-json-schema-field-validation.composable.ts'
import { useXoObjectOptions } from '@/modules/plugin/json-schema-form/use-xo-object-options.composable.ts'
import VtsInputWrapper, { type InputWrapperMessage } from '@core/components/input-wrapper/VtsInputWrapper.vue'
import UiLoader from '@core/components/ui/loader/UiLoader.vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { schema, description, path = [] } = defineProps<JsonSchemaFieldComponentProps>()

const model = defineModel<unknown>()

const { t } = useI18n()

const { fieldId, errorMessage } = useJsonSchemaFieldValidation(() => path)

const reference = computed(() => getXoObjectReference(schema))

const multiple = computed(() => reference.value?.multiple ?? false)

const { options, isReady, hasError } = useXoObjectOptions(() => reference.value?.objectType)

const message = computed<InputWrapperMessage>(() =>
  [
    hasError.value ? { content: t('error-no-data'), accent: 'danger' as const } : description.text,
    errorMessage.value,
  ].filter(item => item !== undefined)
)
</script>
