<template>
  <div class="json-schema-boolean-field">
    <UiCheckbox v-model="checked" accent="brand">{{ label }}</UiCheckbox>
    <UiInfo v-if="description.text !== undefined" accent="info" wrap>
      <JsonSchemaText :text="description.text" />
    </UiInfo>
  </div>
</template>

<script lang="ts" setup>
import type { JsonSchemaFieldComponentProps } from '@/modules/plugin/components/json-schema-form/JsonSchemaField.vue'
import JsonSchemaText from '@/modules/plugin/components/json-schema-form/JsonSchemaText.vue'
import UiCheckbox from '@core/components/ui/checkbox/UiCheckbox.vue'
import UiInfo from '@core/components/ui/info/UiInfo.vue'
import { computed } from 'vue'

const { schema } = defineProps<JsonSchemaFieldComponentProps>()

const model = defineModel<unknown>()

const checked = computed<boolean>({
  get: () => Boolean(model.value ?? schema.default ?? false),
  set: value => {
    model.value = value
  },
})
</script>

<style lang="postcss" scoped>
.json-schema-boolean-field {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.4rem;
}
</style>
