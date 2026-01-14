<template>
  <UiCard :has-error="isError">
    <div class="site-dashboard-storage-repository">
      <UiCardTitle>
        {{ t('storage-repository') }}
        <template #description>{{ t('for-replication') }}</template>
      </UiCardTitle>
      <VtsStateHero v-if="isLoading" format="card" type="busy" size="medium" />
      <VtsStateHero v-if="isEmpty" format="card" type="no-data" size="extra-small" horizontal>
        {{ t('no-data-to-calculate') }}
      </VtsStateHero>
      <template v-else>
        <VtsStackedBarWithLegend :max-value="maxValue" :segments />
        <div class="numbers">
          <UiCardNumbers
            :value="storageRepositories?.used?.value"
            :unit="storageRepositories?.used?.prefix"
            :label="t('used-for-backup')"
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
  </UiCard>
</template>

<script setup lang="ts">
import { useXoSiteDashboard } from '@/modules/site/remote-resources/use-xo-site-dashboard.ts'
import VtsStackedBarWithLegend, {
  type StackedBarWithLegendProps,
} from '@core/components/stacked-bar-with-legend/VtsStackedBarWithLegend.vue'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCardNumbers from '@core/components/ui/card-numbers/UiCardNumbers.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import { computed, type ComputedRef } from 'vue'
import { useI18n } from 'vue-i18n'

const { storageRepositoriesFormatted, hasError } = useXoSiteDashboard()

const { t } = useI18n()

const isLoading = computed(() => storageRepositoriesFormatted.value === undefined)

const isError = computed(() => hasError.value || (!isLoading.value && 'error' in storageRepositoriesFormatted.value!))

const isEmpty = computed(() => !isLoading.value && 'isEmpty' in storageRepositoriesFormatted.value!)

const storageRepositories = computed(() => {
  if (isLoading.value || !('other' in storageRepositoriesFormatted.value!)) {
    return
  }

  return storageRepositoriesFormatted.value
})

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
.site-dashboard-storage-repository {
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
