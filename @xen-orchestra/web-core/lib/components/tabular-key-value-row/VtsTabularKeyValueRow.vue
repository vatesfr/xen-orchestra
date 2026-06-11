<template>
  <div class="vts-tabular-key-value-row">
    <VtsKeyValuePair :label :value :copy :copy-value>
      <template v-if="slots.label" #label>
        <slot name="label" />
      </template>
      <template v-if="slots.value" #value>
        <slot name="value" />
      </template>
    </VtsKeyValuePair>
  </div>
</template>

<script lang="ts" setup>
import VtsKeyValuePair from '@core/components/key-value-pair/VtsKeyValuePair.vue'

defineProps<{
  label?: string
  value?: string
  copy?: boolean
  copyValue?: string
}>()

const slots = defineSlots<{
  label?(): any
  value?(): any
}>()
</script>

<style lang="postcss" scoped>
.vts-tabular-key-value-row {
  display: grid;
  grid-template-columns: subgrid;
  grid-column: span 2;
  align-items: start;

  :deep(.value > .text-ellipsis) {
    flex: 1;
  }

  :deep(.value > .copy-button) {
    min-width: 0;
  }

  @container vts-tabular-key-value-list (max-width: 40rem) {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    gap: 0.8rem;
  }
}
</style>
