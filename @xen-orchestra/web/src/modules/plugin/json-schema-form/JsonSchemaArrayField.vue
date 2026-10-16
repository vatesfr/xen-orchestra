<template>
  <JsonSchemaFieldset
    v-model:used="isUsed"
    class="json-schema-array-field"
    :label
    :description="description.text"
    :path
    :required
    :disabled
  >
    <template v-if="slots.actions" #actions>
      <slot name="actions" />
    </template>
    <div v-for="(field, index) of itemFields" :key="itemKeys[index]" class="item">
      <div class="item-field">
        <JsonSchemaField
          :model-value="field.value"
          :schema="itemSchema"
          :label="field.label"
          :path="field.path"
          :required="isSectionItem"
          :disabled
          @update:model-value="updateItem(index, $event)"
        >
          <template v-if="isSectionItem" #actions>
            <JsonSchemaArrayItemDeleteButton :disabled @click="removeItem(index)" />
          </template>
        </JsonSchemaField>
      </div>
      <JsonSchemaArrayItemDeleteButton
        v-if="!isSectionItem"
        class="delete-button"
        :disabled
        @click="removeItem(index)"
      />
    </div>
    <div>
      <UiButton variant="secondary" accent="brand" size="small" left-icon="fa:plus" :disabled @click="addItem()">
        {{ t('action:add') }}
      </UiButton>
    </div>
  </JsonSchemaFieldset>
</template>

<script lang="ts" setup>
import { getFieldType, getSchemaDefaults, type JsonSchema } from '@/modules/plugin/json-schema-form/json-schema.util.ts'
import JsonSchemaArrayItemDeleteButton from '@/modules/plugin/json-schema-form/JsonSchemaArrayItemDeleteButton.vue'
import type { JsonSchemaFieldComponentProps } from '@/modules/plugin/json-schema-form/JsonSchemaField.vue'
import JsonSchemaField from '@/modules/plugin/json-schema-form/JsonSchemaField.vue'
import JsonSchemaFieldset from '@/modules/plugin/json-schema-form/JsonSchemaFieldset.vue'
import { useJsonSchemaItemLabel } from '@/modules/plugin/json-schema-form/use-json-schema-item-label.composable.ts'
import { useOptionalValue } from '@/modules/plugin/json-schema-form/use-optional-value.composable.ts'
import UiButton from '@core/components/ui/button/UiButton.vue'
import { uniqueId } from 'lodash-es'
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

const { schema, required, path = [] } = defineProps<JsonSchemaFieldComponentProps>()

const model = defineModel<unknown>()

const slots = defineSlots<{
  actions?(): any
}>()

const { t } = useI18n()

const getItemLabel = useJsonSchemaItemLabel()

const isUsed = useOptionalValue(model, {
  required: () => required,
  createValue: () => [],
})

const itemSchema = computed<JsonSchema>(() => schema.items ?? {})

// an object or array item is always used, whereas a simple item can be removed instead of being left empty
const isSectionItem = computed(() => {
  const itemType = getFieldType(itemSchema.value)

  return itemType === 'object' || itemType === 'array'
})

const items = computed(() => (Array.isArray(model.value) ? (model.value as unknown[]) : []))

const itemFields = computed(() =>
  items.value.map((value, index) => ({
    value,
    label: getItemLabel(index, itemSchema.value),
    path: [...path, String(index)],
  }))
)

// stable keys, so that removing an item does not mix up the state of the following ones
const itemKeys = ref<string[]>([])

watch(
  () => items.value.length,
  length => {
    if (itemKeys.value.length !== length) {
      itemKeys.value = Array.from({ length }, () => uniqueId('item-'))
    }
  },
  { immediate: true }
)

function addItem() {
  itemKeys.value.push(uniqueId('item-'))
  model.value = [...items.value, getSchemaDefaults(itemSchema.value)]
}

function removeItem(index: number) {
  itemKeys.value.splice(index, 1)
  model.value = items.value.filter((_, itemIndex) => itemIndex !== index)
}

function updateItem(index: number, value: unknown) {
  model.value = items.value.map((item, itemIndex) => (itemIndex === index ? value : item))
}
</script>

<style lang="postcss" scoped>
.json-schema-array-field {
  .item {
    display: flex;
    align-items: flex-start;
    gap: 0.8rem;

    /*
     * the delete button of a simple item is centered on its input:
     * label (2.4rem) + gap (0.4rem) of VtsInputWrapper, then the small button (2.4rem) centered on the input (4rem)
     */
    .delete-button {
      margin-block-start: calc(2.4rem + 0.4rem + (4rem - 2.4rem) / 2);
    }

    .item-field {
      display: flex;
      flex-direction: column;
      flex: 1;
      min-width: 0;
    }
  }
}
</style>
