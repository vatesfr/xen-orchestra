<template>
  <div class="storage-repository">
    <UiCardTitle>
      {{ t('storage-repository') }}
      <template #description>{{ t('for-replication') }}</template>
    </UiCardTitle>
    <VtsLoadingHero v-if="!areStorageRepositoriesReady" type="card" />
    <template v-else>
      <VtsStackedBarWithLegend :max-value="maxValue" :segments />
      <div class="numbers">
        <UiCardNumbers
          :value="storageRepositories?.used?.value"
          :unit="storageRepositories?.used?.prefix"
          :label="t('used')"
          size="medium"
        />
        <UiCardNumbers
          :value="storageRepositories?.available?.value"
          :unit="storageRepositories?.available?.prefix"
          :label="t('available')"
          size="medium"
        />
        <UiCardNumbers
          :value="storageRepositories?.total?.value"
          :unit="storageRepositories?.total?.prefix"
          :label="t('total')"
          size="medium"
        />
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { useDashboardStore } from '@/stores/xo-rest-api/dashboard.store'
import VtsStackedBarWithLegend, {
  type StackedBarWithLegendProps,
} from '@core/components/stacked-bar-with-legend/VtsStackedBarWithLegend.vue'
import VtsLoadingHero from '@core/components/state-hero/VtsLoadingHero.vue'
import UiCardNumbers from '@core/components/ui/card-numbers/UiCardNumbers.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import { computed, type ComputedRef } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const { storageRepositories } = useDashboardStore().subscribe()

const areStorageRepositoriesReady = computed(() => storageRepositories.value !== undefined)

const segments: ComputedRef<StackedBarWithLegendProps['segments']> = computed(() => [
  {
    label: t('xo-replications'),
    value: storageRepositories.value?.replicated?.value ?? 0,
    accent: 'info',
    unit: storageRepositories.value?.replicated?.prefix,
  },
  {
    label: t('other'),
    value: storageRepositories.value?.other?.value ?? 0,
    accent: 'warning',
    unit: storageRepositories.value?.other?.prefix,
  },
])

const maxValue = computed(() => ({
  value: storageRepositories.value?.total?.value,
  unit: storageRepositories.value?.total?.prefix,
}))
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
