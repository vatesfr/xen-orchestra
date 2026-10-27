<template>
  <JsonSchemaSelectField v-model="model" :options :label :description="description.text" :path :required />
</template>

<script lang="ts" setup>
import type { JsonSchemaSelectOption } from '@/modules/plugin/json-schema-form/json-schema.util.ts'
import type { JsonSchemaFieldComponentProps } from '@/modules/plugin/json-schema-form/JsonSchemaField.vue'
import JsonSchemaSelectField from '@/modules/plugin/json-schema-form/JsonSchemaSelectField.vue'
import { computed } from 'vue'

const { schema } = defineProps<JsonSchemaFieldComponentProps>()

const model = defineModel<unknown>()

const options = computed<JsonSchemaSelectOption[]>(() =>
  (schema.enum ?? []).map((value, index) => ({
    value,
    label: schema.enumNames?.[index] ?? String(value),
  }))
)
</script>
