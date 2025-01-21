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
    <VtsErrorNoDataHero v-if="hasError" type="table" />
    <VtsStateHero v-if="noDataMessage" type="table" image="no-data">
      {{ noDataMessage }}
    </VtsStateHero>
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
