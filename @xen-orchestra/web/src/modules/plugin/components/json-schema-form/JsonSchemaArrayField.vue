<template>
  <div v-for="(field, index) of itemFields" :key="itemKeys[index]" class="item">
    <div class="item-field">
      <JsonSchemaField
        :model-value="field.value"
        :schema="itemSchema"
        :label="field.label"
        :path="field.path"
        :required="isSectionItem"
        @update:model-value="updateItem(index, $event)"
      >
        <template v-if="isSectionItem" #actions>
          <JsonSchemaArrayItemDeleteButton @click="removeItem(index)" />
        </template>
      </JsonSchemaField>
    </div>
    <JsonSchemaArrayItemDeleteButton v-if="!isSectionItem" class="delete-button" @click="removeItem(index)" />
  </div>
  <div>
    <UiButton variant="secondary" accent="brand" size="small" left-icon="fa:plus" @click="addItem()">
      {{ t('action:add') }}
    </UiButton>
  </div>
</template>

<script lang="ts" setup>
import JsonSchemaArrayItemDeleteButton from '@/modules/plugin/components/json-schema-form/JsonSchemaArrayItemDeleteButton.vue'
import type { JsonSchemaFieldComponentProps } from '@/modules/plugin/components/json-schema-form/JsonSchemaField.vue'
import JsonSchemaField from '@/modules/plugin/components/json-schema-form/JsonSchemaField.vue'
import { useJsonSchemaItemLabel } from '@/modules/plugin/composables/use-json-schema-item-label.composable.ts'
import { getSchemaDefaults, isSectionSchema, type JsonSchema } from '@/modules/plugin/utils/json-schema.util.ts'
import UiButton from '@core/components/ui/button/UiButton.vue'
import { uniqueId } from 'lodash-es'
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

const { schema, path = [] } = defineProps<JsonSchemaFieldComponentProps>()

const model = defineModel<unknown>()

const { t } = useI18n()

const getItemLabel = useJsonSchemaItemLabel()

const itemSchema = computed<JsonSchema>(() => schema.items ?? {})

// an object or array item is always used, whereas a simple item can be removed instead of being left empty
const isSectionItem = computed(() => isSectionSchema(itemSchema.value))

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
</style>
