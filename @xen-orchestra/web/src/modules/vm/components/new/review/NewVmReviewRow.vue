<template>
  <VtsTabularKeyValueRow :label>
    <template v-if="slots.default || overridden || hasValue" #value>
      <span class="new-vm-review-row-value">
        <slot>{{ value }}</slot>
        <NewVmReviewMarker :marker="overridden ? 'overridden' : undefined" />
      </span>
    </template>
  </VtsTabularKeyValueRow>
</template>

<script lang="ts" setup>
import NewVmReviewMarker from '@/modules/vm/components/new/review/NewVmReviewMarker.vue'
import VtsTabularKeyValueRow from '@core/components/tabular-key-value-row/VtsTabularKeyValueRow.vue'
import { computed } from 'vue'

const { value, overridden } = defineProps<{
  label: string
  value?: string | number
  overridden?: boolean
}>()

const slots = defineSlots<{
  default?(): any
}>()

const hasValue = computed(() => value !== undefined && value !== '')
</script>

<style lang="postcss" scoped>
.new-vm-review-row-value {
  display: inline-flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.8rem 1.6rem;
  max-width: 100%;
  white-space: normal;
  overflow-wrap: anywhere;
}
</style>
