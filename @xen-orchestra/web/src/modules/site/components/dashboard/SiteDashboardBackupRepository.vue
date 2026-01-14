<template>
  <UiCard :has-error="isError">
    <div class="site-dashboard-backup-repository">
      <UiCardTitle>
        {{ t('backup-repository') }}
        <template #description>{{ t('for-backup') }}</template>
      </UiCardTitle>
      <VtsStateHero v-if="isLoading" format="card" type="busy" size="medium" />
      <VtsStateHero v-if="isEmpty" format="card" type="no-data" size="extra-small" horizontal>
        {{ t('no-data-to-calculate') }}
      </VtsStateHero>
      <VtsStateHero v-else-if="isError" format="card" type="error" size="extra-small" horizontal>
        {{ t('error-no-data') }}
      </VtsStateHero>
      <template v-else>
        <VtsStackedBarWithLegend :max-value="maxValue" :segments />
        <div class="numbers">
          <UiCardNumbers
            :value="backupRepositories?.used?.value"
            :unit="backupRepositories?.used?.prefix"
            :label="t('used-for-backup')"
            size="medium"
          />
          <UiCardNumbers
            :value="backupRepositories?.available?.value"
            :unit="backupRepositories?.available?.prefix"
            :label="t('available')"
            size="medium"
          />
          <UiCardNumbers
            :value="backupRepositories?.total?.value"
            :unit="backupRepositories?.total?.prefix"
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

const { backupRepositoriesFormatted, hasError } = useXoSiteDashboard()

const { t } = useI18n()

const isLoading = computed(() => backupRepositoriesFormatted.value === undefined)

const isError = computed(() => hasError.value || (!isLoading.value && 'error' in backupRepositoriesFormatted.value!))

const isEmpty = computed(() => !isLoading.value && 'isEmpty' in backupRepositoriesFormatted.value!)

const backupRepositories = computed(() => {
  if (isLoading.value || !('other' in backupRepositoriesFormatted.value!)) {
    return
  }

  return backupRepositoriesFormatted.value
})

const segments: ComputedRef<StackedBarWithLegendProps['segments']> = computed(() => {
  return [
    {
      label: t('xo-backups'),
      value: backupRepositories.value?.backups.value ?? 0,
      accent: 'info',
      unit: backupRepositories.value?.backups.prefix,
    },
    {
      label: t('other'),
      value: backupRepositories.value?.other.value ?? 0,
      accent: 'warning',
      unit: backupRepositories.value?.other.prefix,
    },
  ]
})

const maxValue = computed(() => ({
  value: backupRepositories.value?.total.value,
  unit: backupRepositories.value?.total.prefix,
}))
</script>

<style scoped lang="postcss">
.site-dashboard-backup-repository {
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
