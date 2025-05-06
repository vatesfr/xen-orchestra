<template>
  <UiCard class="pool-storage-usage">
    <UiCardTitle>
      {{ $t('storage-usage') }}
      <template #info>
        {{ $t('top-#', 5) }}
      </template>
    </UiCardTitle>
    <VtsLoadingHero v-if="!isReady" type="card" />
    <template v-else>
      <UiProgressBar
        v-for="storageUsage in storageUsages.srs.splice(0, 5)"
        :key="storageUsage.id"
        class="progressBar"
        :value="storageUsage.used?.value ?? 0"
        :max="storageUsage.total?.value"
        :legend="storageUsage.name"
      />
      <div class="total">
        <UiCardNumbers
          :label="$t('total-used')"
          :unit="storageUsages.storageUsageTotal?.prefix"
          :value="storageUsages.storageUsageTotal?.value"
          size="medium"
        />
        <UiCardNumbers
          :label="$t('total-free')"
          :unit="storageUsages.storageFreeTotal?.prefix"
          :value="storageUsages.storageFreeTotal?.value"
          size="medium"
        />
      </div>
    </template>
  </UiCard>
</template>

<script lang="ts" setup>
import { useSrStore } from '@/stores/xo-rest-api/sr.store'
import VtsLoadingHero from '@core/components/state-hero/VtsLoadingHero.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCardNumbers from '@core/components/ui/card-numbers/UiCardNumbers.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import UiProgressBar from '@core/components/ui/progress-bar/UiProgressBar.vue'
import { formatSizeRaw } from '@core/utils/size.util'
import { computed } from 'vue'

const { poolId } = defineProps<{
  poolId: string
}>()

const { records: srs, isReady } = useSrStore().subscribe()

const filteredSrs = computed(() => {
  return srs.value.filter(sr => sr.$pool === poolId)
})

const storageUsages = computed(() => {
  let storageUsageTotal = 0
  let storageFreeTotal = 0
  return {
    srs: filteredSrs.value
      .map(sr => {
        storageUsageTotal += sr.physical_usage
        storageFreeTotal += sr.size - sr.physical_usage
        return {
          total: formatSizeRaw(sr.size, 0),
          used: formatSizeRaw(sr.physical_usage, 0),
          free: formatSizeRaw(sr.size - sr.physical_usage, 0),
          id: sr.id,
          name: sr.name_label,
        }
      })
      .sort(
        (a, b) =>
          // reproduce calcul in progress bar.
          (b.used?.value ?? 0) / ((b.total?.value ?? 0) > 1 ? (b.total?.value ?? 1) : 1) -
          (a.used?.value ?? 0) / ((a.total?.value ?? 0) > 1 ? (a.total?.value ?? 1) : 1)
      ),
    storageUsageTotal: formatSizeRaw(storageUsageTotal, 0),
    storageFreeTotal: formatSizeRaw(storageFreeTotal, 0),
  }
})
</script>

<style scoped lang="postcss">
.pool-storage-usage {
  .total {
    display: grid;
    grid-template-columns: 1fr 1fr;
    margin-block-start: auto;
  }
}
</style>
