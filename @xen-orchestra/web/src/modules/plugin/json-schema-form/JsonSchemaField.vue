<template>
  <component
    :is="FIELD_COMPONENTS[fieldType]"
    v-if="fieldType !== undefined"
    :key="fieldKey"
    v-model="model"
    v-bind="fieldProps"
  >
    <template v-if="slots.actions" #actions>
      <slot name="actions" />
    </template>
  </component>
  <UiInfo v-else accent="warning" wrap>{{ t('json-schema:unsupported-field', { label }) }}</UiInfo>
</template>

<script lang="ts" setup>
import {
  type JsonSchemaDescription,
  parseSchemaDescription,
} from '@/modules/plugin/json-schema-form/json-schema-description.util.ts'
import type { JsonSchemaPath } from '@/modules/plugin/json-schema-form/json-schema-validation.util.ts'
import {
  getFieldType,
  getSchemaType,
  type JsonSchema,
  type JsonSchemaFieldType,
} from '@/modules/plugin/json-schema-form/json-schema.util.ts'
import JsonSchemaArrayField from '@/modules/plugin/json-schema-form/JsonSchemaArrayField.vue'
import JsonSchemaBooleanField from '@/modules/plugin/json-schema-form/JsonSchemaBooleanField.vue'
import JsonSchemaEnumField from '@/modules/plugin/json-schema-form/JsonSchemaEnumField.vue'
import JsonSchemaInputField from '@/modules/plugin/json-schema-form/JsonSchemaInputField.vue'
import JsonSchemaObjectField from '@/modules/plugin/json-schema-form/JsonSchemaObjectField.vue'
import JsonSchemaXoObjectField from '@/modules/plugin/json-schema-form/JsonSchemaXoObjectField.vue'
import UiInfo from '@core/components/ui/info/UiInfo.vue'
import { type Component, computed } from 'vue'
import { useI18n } from 'vue-i18n'

export type JsonSchemaFieldProps = {
  schema: JsonSchema
  label: string
  path?: JsonSchemaPath
  required?: boolean
  disabled?: boolean
}

export type JsonSchemaFieldComponentProps = JsonSchemaFieldProps & {
  description: JsonSchemaDescription
}

const { schema, label, path = [], required, disabled } = defineProps<JsonSchemaFieldProps>()

const model = defineModel<unknown>()

const slots = defineSlots<{
  actions?(): any
}>()

const { t } = useI18n()

const FIELD_COMPONENTS: Record<JsonSchemaFieldType, Component> = {
  array: JsonSchemaArrayField,
  boolean: JsonSchemaBooleanField,
  enum: JsonSchemaEnumField,
  integer: JsonSchemaInputField,
  number: JsonSchemaInputField,
  object: JsonSchemaObjectField,
  string: JsonSchemaInputField,
  'xo-object': JsonSchemaXoObjectField,
}

const fieldType = computed(() => getFieldType(schema))

const fieldKey = computed(() => `${fieldType.value}-${getSchemaType(schema)}-${required}`)

const description = computed(() => parseSchemaDescription(schema.description))

const fieldProps = computed<JsonSchemaFieldComponentProps>(() => ({
  schema,
  label,
  path,
  required,
  disabled,
  description: description.value,
}))
</script>
