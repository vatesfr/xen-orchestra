<template>
  <div class="vts-query-builder-row">
    <VtsQueryBuilderTreeLine />
    <div class="content">
      <VtsQueryBuilderGroup
        v-if="node.isGroup"
        :key="node.id"
        v-model="node"
        @duplicate="emit('duplicate')"
        @remove="keepChildren => emit('remove', keepChildren)"
      />
      <UiInput v-else-if="!node.isValid" :model-value="node.rawFilter" class="raw-filter" disabled accent="brand" />
      <VtsQueryBuilderFilter
        v-else
        v-model:property="node.property"
        v-model:operator="node.operator"
        v-model:value="node.value"
        :class="node.operator"
        :properties="node.propertyOptions"
        :operators="node.operatorOptions"
        :values="node.valueOptions"
        :value-type="node.valueType"
        @convert-to-group="emit('convertToGroup')"
        @duplicate="emit('duplicate')"
        @remove="emit('remove')"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
import VtsQueryBuilderFilter from '@core/components/query-builder/VtsQueryBuilderFilter.vue'
import VtsQueryBuilderGroup from '@core/components/query-builder/VtsQueryBuilderGroup.vue'
import VtsQueryBuilderTreeLine from '@core/components/query-builder/VtsQueryBuilderTreeLine.vue'
import UiInput from '@core/components/ui/input/UiInput.vue'
import type { QueryBuilderNode } from '@core/packages/query-builder/types'

defineProps<{
  index: number
}>()

const emit = defineEmits<{
  convertToGroup: []
  duplicate: []
  remove: [keepChildren?: boolean]
}>()

const node = defineModel<QueryBuilderNode>('node', { required: true })
</script>

<style lang="postcss" scoped>
.vts-query-builder-row {
  display: flex;
  align-items: stretch;

  & > .border {
    display: flex;
    flex-direction: column;
    margin-inline-start: 1rem;

    &::before,
    &::after {
      content: '';
      border-left: 0.3rem solid #00000060;
      padding-left: 2rem;
    }

    &::before {
      height: 3rem;
      border-bottom: 0.3rem solid #00000060;
    }

    &::after {
      flex: 1;
    }
  }

  & > .content {
    flex: 1;
    padding-block-end: 0.5rem;
    min-width: 0;
  }

  &:first-child > .content {
    padding-block-start: 0.5rem;
  }
}
</style>
