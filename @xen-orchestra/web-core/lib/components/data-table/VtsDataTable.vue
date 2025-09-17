<template>
  <div class="table-container">
    <VtsStateHero v-if="!isReady" format="table" busy size="medium" />
    <VtsStateHero v-else-if="hasError" format="table" type="error" size="small" no-background>
      {{ t('error-no-data') }}
    </VtsStateHero>
    <VtsStateHero v-else-if="noDataMessage" format="table" type="no-data" size="small">
      {{ noDataMessage ? noDataMessage : t('no-data') }}
    </VtsStateHero>
    <VtsTable v-else vertical-border>
      <thead>
        <slot name="thead" />
      </thead>
      <tbody>
        <slot name="tbody" />
      </tbody>
    </VtsTable>
  </div>
</template>

<script lang="ts" setup>
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import VtsTable from '@core/components/table/VtsTable.vue'
import { useI18n } from 'vue-i18n'

defineProps<{
  isReady?: boolean
  hasError?: boolean
  noDataMessage?: string
}>()

defineSlots<{
  thead(): any
  tbody(): any
}>()

const { t } = useI18n()
</script>

<style lang="postcss" scoped>
.table-container {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
  overflow-x: auto;

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

  :deep(th) {
    width: 10rem;
  }
}
</style>
