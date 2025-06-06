<template>
  <div class="backup-repository">
    <UiCardTitle>
      {{ t('backup-repository') }}
      <template #description>{{ t('for-backup') }}</template>
    </UiCardTitle>
    <VtsLoadingHero v-if="!isReady" type="card" />
    <template v-else>
      <VtsStackedBarWithLegend :max-value="maxValue" :segments />
      <div class="numbers">
        <UiCardNumbers
          :value="backupRepositories.used?.value"
          :unit="backupRepositories.used?.prefix"
          :label="t('used')"
          size="medium"
        />
        <UiCardNumbers
          :value="backupRepositories.available?.value"
          :unit="backupRepositories.available?.prefix"
          :label="t('available')"
          size="medium"
        />
        <UiCardNumbers
          :value="backupRepositories.total?.value"
          :unit="backupRepositories.total?.prefix"
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

const { backupRepositories, isReady } = useDashboardStore().subscribe()

const segments: ComputedRef<StackedBarWithLegendProps['segments']> = computed(() => [
  {
    label: t('xo-backups'),
    value: backupRepositories.value.backups?.value ?? 0,
    accent: 'info',
    unit: backupRepositories.value.backups?.prefix,
  },
  {
    label: t('other'),
    value: backupRepositories.value.other?.value ?? 0,
    accent: 'warning',
    unit: backupRepositories.value.other?.prefix,
  },
])

const maxValue = computed(() => ({
  value: backupRepositories.value.total?.value,
  unit: backupRepositories.value.total?.prefix,
}))
</script>

<style scoped lang="postcss">
.backup-repository {
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
