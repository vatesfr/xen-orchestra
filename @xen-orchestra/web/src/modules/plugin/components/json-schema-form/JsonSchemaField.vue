<template>
  <UiInfo v-if="fieldType === undefined" accent="warning" wrap>
    {{ t('json-schema:unsupported-field', { label }) }}
  </UiInfo>
  <JsonSchemaFieldset
    v-else-if="isSectionSchema(schema)"
    :key="fieldKey"
    v-model="model"
    :label
    :description="description.text"
    :path
    :required
    :create-value="createSectionValue"
  >
    <template v-if="slots.actions" #actions>
      <slot name="actions" />
    </template>
    <component :is="FIELD_COMPONENTS[fieldType]" v-model="model" v-bind="fieldProps" />
  </JsonSchemaFieldset>
  <component :is="FIELD_COMPONENTS[fieldType]" v-else :key="fieldKey" v-model="model" v-bind="fieldProps" />
</template>

<script lang="ts" setup>
import JsonSchemaArrayField from '@/modules/plugin/components/json-schema-form/JsonSchemaArrayField.vue'
import JsonSchemaBooleanField from '@/modules/plugin/components/json-schema-form/JsonSchemaBooleanField.vue'
import JsonSchemaEnumField from '@/modules/plugin/components/json-schema-form/JsonSchemaEnumField.vue'
import JsonSchemaFieldset from '@/modules/plugin/components/json-schema-form/JsonSchemaFieldset.vue'
import JsonSchemaInputField from '@/modules/plugin/components/json-schema-form/JsonSchemaInputField.vue'
import JsonSchemaObjectField from '@/modules/plugin/components/json-schema-form/JsonSchemaObjectField.vue'
import JsonSchemaXoObjectField from '@/modules/plugin/components/json-schema-form/JsonSchemaXoObjectField.vue'
import {
  type JsonSchemaDescription,
  parseSchemaDescription,
} from '@/modules/plugin/utils/json-schema-description.util.ts'
import type { JsonSchemaPath } from '@/modules/plugin/utils/json-schema-validation.util.ts'
import {
  getFieldType,
  getSchemaDefaults,
  getSchemaType,
  isSectionSchema,
  type JsonSchema,
  type JsonSchemaFieldType,
} from '@/modules/plugin/utils/json-schema.util.ts'
import UiInfo from '@core/components/ui/info/UiInfo.vue'
import { type Component, computed } from 'vue'
import { useI18n } from 'vue-i18n'

export type JsonSchemaFieldProps = {
  schema: JsonSchema
  label: string
  path?: JsonSchemaPath
  required?: boolean
}

export type JsonSchemaFieldComponentProps = JsonSchemaFieldProps & {
  description: JsonSchemaDescription
}

const { schema, label, path = [], required } = defineProps<JsonSchemaFieldProps>()

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
  description: description.value,
}))

// the value a section gets when it is turned on
function createSectionValue() {
  return fieldType.value === 'array' ? [] : (getSchemaDefaults(schema) ?? {})
}
</script>
