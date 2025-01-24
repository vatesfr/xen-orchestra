<template>
  <div class="table-container">
    <VtsLoadingHero :disabled="isReady" type="table">
      <VtsTable vertical-border>
        <thead>
          <slot name="thead" />
        </thead>
        <tbody>
          <slot name="tbody" />
        </tbody>
      </VtsTable>
    </VtsLoadingHero>
    <VtsErrorNoDataHero v-if="isReady && hasError" type="table" />
    <VtsStateHero v-if="isReady && noDataMessage" type="table" image="no-data" />
  </div>
</template>

<script setup lang="ts">
import VtsErrorNoDataHero from '@core/components/state-hero/VtsErrorNoDataHero.vue'
import VtsLoadingHero from '@core/components/state-hero/VtsLoadingHero.vue'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import VtsTable from '@core/components/table/VtsTable.vue'

defineProps<{
  isReady?: boolean
  hasError?: boolean
  noDataMessage?: string
}>()

defineSlots<{
  thead(): any
  tbody(): any
}>()
</script>

<style lang="postcss" scoped>
.table-container {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;

  :deep(tbody) tr {

    &:hover {
      cursor: pointer;
      background-color: var(--color-brand-background-hover);
    }

    &:active {
      background-color: var(--color-brand-background-active);
    }

    &.selected {
      background-color: var(--color-brand-background-selected);
    }

    &:last-child {
      border-bottom: 0.1rem solid var(--color-neutral-border);
    }
  }
}
</style>
