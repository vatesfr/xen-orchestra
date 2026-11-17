<template>
  <template v-for="section of sections" :key="section.key">
    <UiCardSubtitle v-if="section.title !== undefined">{{ section.title }}</UiCardSubtitle>
    <VtsTabularKeyValueList>
      <VtsTabularKeyValueRow
        v-for="row of section.rows"
        :key="row.key"
        :label="row.label"
        :value="row.kind === 'text' ? row.text : undefined"
      >
        <template v-if="row.kind !== 'text'" #value>
          <template v-if="row.kind === 'secret'">{{ SECRET_MASK }}</template>
          <VtsStatus v-else-if="row.kind === 'boolean'" :status="row.enabled" />
          <div v-else-if="row.kind === 'list'" class="list">
            <span v-for="(item, index) of row.items" :key="index">{{ item }}</span>
          </div>
          <JsonSchemaXoObjectValue v-else :object-type="row.objectType" :ids="row.ids" />
        </template>
      </VtsTabularKeyValueRow>
    </VtsTabularKeyValueList>
  </template>
</template>

<script lang="ts" setup>
import JsonSchemaXoObjectValue from '@/modules/plugin/components/json-schema-form/JsonSchemaXoObjectValue.vue'
import { useJsonSchemaItemLabel } from '@/modules/plugin/composables/use-json-schema-item-label.composable.ts'
import { useJsonSchemaNestedLabel } from '@/modules/plugin/composables/use-json-schema-nested-label.composable.ts'
import { getJsonSchemaValueSections } from '@/modules/plugin/utils/json-schema-value.util.ts'
import type { JsonSchema } from '@/modules/plugin/utils/json-schema.util.ts'
import VtsStatus from '@core/components/status/VtsStatus.vue'
import VtsTabularKeyValueList from '@core/components/tabular-key-value-list/VtsTabularKeyValueList.vue'
import VtsTabularKeyValueRow from '@core/components/tabular-key-value-row/VtsTabularKeyValueRow.vue'
import UiCardSubtitle from '@core/components/ui/card-subtitle/UiCardSubtitle.vue'
import { computed } from 'vue'

const { schema, value } = defineProps<{
  schema: JsonSchema
  value: unknown
}>()

const SECRET_MASK = '••••••••'

const getItemLabel = useJsonSchemaItemLabel()

const getNestedLabel = useJsonSchemaNestedLabel()

// the root section is titled by its container (e.g. a card title)
const sections = computed(() =>
  getJsonSchemaValueSections(schema, value, { getItemLabel }).map(section => ({
    ...section,
    title: section.labels.length > 0 ? getNestedLabel(section.labels) : undefined,
  }))
)
</script>

<style lang="postcss" scoped>
.list {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}
</style>
