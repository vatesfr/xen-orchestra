<template>
  <JsonSchemaFieldset
    v-model:used="isUsed"
    class="json-schema-object-field"
    :label
    :description="description.text"
    :path
    :required
    :disabled
  >
    <div
      v-for="group of propertyGroups"
      :key="group.fields[0].key"
      class="group"
      :class="{ booleans: group.isBooleans }"
    >
      <JsonSchemaField
        v-for="field of group.fields"
        :key="field.key"
        :model-value="objectValue[field.key]"
        :schema="field.schema"
        :label="field.label"
        :path="field.path"
        :required="field.required"
        :disabled
        @update:model-value="updateProperty(field.key, $event)"
      />
    </div>
  </JsonSchemaFieldset>
</template>

<script lang="ts" setup>
import type { JsonSchemaPath } from '@/modules/plugin/json-schema-form/json-schema-validation.util.ts'
import {
  getFieldType,
  getPropertyLabel,
  getSchemaDefaults,
  isObject,
  type JsonSchema,
} from '@/modules/plugin/json-schema-form/json-schema.util.ts'
import type { JsonSchemaFieldComponentProps } from '@/modules/plugin/json-schema-form/JsonSchemaField.vue'
import JsonSchemaField from '@/modules/plugin/json-schema-form/JsonSchemaField.vue'
import JsonSchemaFieldset from '@/modules/plugin/json-schema-form/JsonSchemaFieldset.vue'
import { useOptionalValue } from '@/modules/plugin/json-schema-form/use-optional-value.composable.ts'
import { computed } from 'vue'

const { schema, required, path = [] } = defineProps<JsonSchemaFieldComponentProps>()

const model = defineModel<unknown>()

const isUsed = useOptionalValue(model, {
  required: () => required,
  createValue: () => getSchemaDefaults(schema) ?? {},
})

type PropertyField = { key: string; schema: JsonSchema; label: string; path: JsonSchemaPath; required: boolean }

const requiredKeys = computed(() => new Set(schema.required ?? []))

const propertyGroups = computed(() => {
  const groups: { fields: PropertyField[]; isBooleans: boolean }[] = []

  for (const [key, propertySchema] of Object.entries(schema.properties ?? {})) {
    const field: PropertyField = {
      key,
      schema: propertySchema,
      label: getPropertyLabel(key, propertySchema),
      path: [...path, key],
      required: requiredKeys.value.has(key),
    }
    const isBoolean = getFieldType(propertySchema) === 'boolean'
    const lastGroup = groups.at(-1)

    if (isBoolean && lastGroup?.isBooleans) {
      lastGroup.fields.push(field)
    } else {
      groups.push({ fields: [field], isBooleans: isBoolean })
    }
  }

  return groups
})

const objectValue = computed(() => (isObject(model.value) ? model.value : {}))

function updateProperty(key: string, value: unknown) {
  model.value = { ...objectValue.value, [key]: value }
}
</script>

<style lang="postcss" scoped>
.json-schema-object-field {
  .group {
    /* a single field is laid out by the section, like if there was no group */
    display: contents;

    &.booleans {
      display: flex;
      flex-direction: column;
      gap: 1.6rem;
      padding: 1.6rem;
      border: 0.1rem solid var(--color-neutral-border);
      border-radius: 0.8rem;
      background-color: var(--color-neutral-background-primary);
    }
  }
}
</style>
