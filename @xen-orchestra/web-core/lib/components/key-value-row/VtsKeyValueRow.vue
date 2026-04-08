<template>
  <div class="vts-key-value-row" :class="{ mobile: uiStore.isSmallOrMedium }">
    <VtsKeyValuePair :label :value>
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
import { useUiStore } from '@core/stores/ui.store.ts'

defineProps<{
  label?: string
  value?: string
}>()

const slots = defineSlots<{
  label?(): any
  value?(): any
}>()

const uiStore = useUiStore()
</script>

<style lang="postcss" scoped>
.vts-key-value-row {
  display: flex;
  gap: 2.4rem;

  &.mobile {
    flex-direction: column;
    gap: 0.8rem;
  }

  :deep(dt) {
    flex-shrink: 0;
  }
}
</style>
