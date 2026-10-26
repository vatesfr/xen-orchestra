<template>
  <VtsInputWrapper :id="fieldId" :label :message wrap-message @focusout="touch()">
    <slot />
    <template #message="{ content }">
      <JsonSchemaText :text="content" />
    </template>
  </VtsInputWrapper>
</template>

<script lang="ts" setup>
import type { JsonSchemaPath } from '@/modules/plugin/json-schema-form/json-schema-validation.util.ts'
import JsonSchemaText from '@/modules/plugin/json-schema-form/JsonSchemaText.vue'
import { useJsonSchemaFieldValidation } from '@/modules/plugin/json-schema-form/use-json-schema-field-validation.composable.ts'
import VtsInputWrapper, { type InputWrapperMessage } from '@core/components/input-wrapper/VtsInputWrapper.vue'
import { computed } from 'vue'

const { description, path = [] } = defineProps<{
  label: string
  description?: InputWrapperMessage
  path?: JsonSchemaPath
}>()

defineSlots<{
  default(): any
}>()

const { fieldId, errorMessage, touch } = useJsonSchemaFieldValidation(() => path)

const message = computed<InputWrapperMessage>(() =>
  [description, errorMessage.value].flat().filter(item => item !== undefined)
)
</script>
