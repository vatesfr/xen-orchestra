<template>
  <div v-for="group of propertyGroups" :key="group.fields[0].key" class="group" :class="{ booleans: group.isBooleans }">
    <JsonSchemaField
      v-for="field of group.fields"
      :key="field.key"
      :model-value="objectValue[field.key]"
      :schema="field.schema"
      :label="field.label"
      :path="field.path"
      :required="field.required"
      @update:model-value="updateProperty(field.key, $event)"
    />
  </div>
</template>

<script lang="ts" setup>
import type { JsonSchemaFieldComponentProps } from '@/modules/plugin/components/json-schema-form/JsonSchemaField.vue'
import JsonSchemaField from '@/modules/plugin/components/json-schema-form/JsonSchemaField.vue'
import { getPropertyGroups, isObject } from '@/modules/plugin/utils/json-schema.util.ts'
import { computed } from 'vue'

const { schema, path = [] } = defineProps<JsonSchemaFieldComponentProps>()

const model = defineModel<unknown>()

const propertyGroups = computed(() => getPropertyGroups(schema, path))

const objectValue = computed(() => (isObject(model.value) ? model.value : {}))

function updateProperty(key: string, value: unknown) {
  model.value = { ...objectValue.value, [key]: value }
}
</script>

<style lang="postcss" scoped>
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
</style>
