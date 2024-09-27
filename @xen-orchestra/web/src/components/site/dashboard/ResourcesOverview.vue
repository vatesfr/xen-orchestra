<template>
  <UiCard>
    <CardTitle>{{ $t('resources-overview') }}</CardTitle>
    <LoadingHero :disabled="isReady" type="card">
      <div class="line-1">
        <CardNumbers :label="$t('total-memory')" :value="memorySize?.value" :unit="memorySize?.prefix" size="medium" />
        <CardNumbers :label="$t('total-cpus')" :value="nCpus" size="medium" />
      </div>
      <CardNumbers
        :label="$t('total-storage-repository')"
        :value="srSize?.value"
        :unit="srSize?.prefix"
        size="medium"
      />
    </LoadingHero>
  </UiCard>
</template>

<script lang="ts" setup>
import { useDashboardStore } from '@/stores/xo-rest-api/dashboard.store'
import { formatSizeRaw } from '@/utils/size.util'
import CardTitle from '@core/components/card/CardTitle.vue'
import CardNumbers from '@core/components/CardNumbers.vue'
import LoadingHero from '@core/components/state-hero/LoadingHero.vue'
import UiCard from '@core/components/UiCard.vue'
import { computed } from 'vue'

const { record, isReady } = useDashboardStore().subscribe()

const nCpus = computed(() => record.value?.resourcesOverview?.nCpus)
const memorySize = computed(() => formatSizeRaw(record.value?.resourcesOverview?.memorySize, 1))
const srSize = computed(() => formatSizeRaw(record.value?.resourcesOverview?.srSize, 1))
</script>

<style lang="postcss" scoped>
.line-1 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}
</style>
