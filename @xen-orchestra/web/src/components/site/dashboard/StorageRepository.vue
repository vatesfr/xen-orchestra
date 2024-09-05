<template>
  <div class="storage-repository">
    <CardTitle>
      {{ $t('storage-repository') }}
      <template #description>{{ $t('for-replication') }}</template>
    </CardTitle>
    <LoadingHero type="card" :disabled="isReady">
      <StackedBarWithLegend :max-value="storageRepositories.total?.value" :segments />
      <div class="numbers">
        <CardNumbers
          :value="storageRepositories.used?.value"
          :unit="storageRepositories.used?.prefix"
          :label="$t('used')"
          size="medium"
        />
        <CardNumbers
          :value="storageRepositories.available?.value"
          :unit="storageRepositories.available?.prefix"
          :label="$t('available')"
          size="medium"
        />
        <CardNumbers
          :value="storageRepositories.total?.value"
          :unit="storageRepositories.total?.prefix"
          :label="$t('total')"
          size="medium"
        />
      </div>
    </LoadingHero>
  </div>
</template>

<script setup lang="ts">
import { useDashboardStore } from '@/stores/xo-rest-api/dashboard.store'
import CardTitle from '@core/components/card/CardTitle.vue'
import CardNumbers from '@core/components/CardNumbers.vue'
import StackedBarWithLegend, {
  type StackedBarWithLegendProps,
} from '@core/components/stacked-bar-with-legend/StackedBarWithLegend.vue'
import LoadingHero from '@core/components/state-hero/LoadingHero.vue'
import { computed, type ComputedRef } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const { storageRepositories, isReady } = useDashboardStore().subscribe()

const segments: ComputedRef<StackedBarWithLegendProps['segments']> = computed(() => [
  {
    label: t('backups'),
    value: storageRepositories.value.used?.value ?? 0,
    color: 'primary',
    unit: storageRepositories.value.used?.prefix,
  },
])
</script>

<style scoped lang="postcss">
.storage-repository {
  display: flex;
  flex-direction: column;
  gap: 2.4rem;
  flex: 1;
}

.numbers {
  display: flex;
  justify-content: space-between;
}
</style>
