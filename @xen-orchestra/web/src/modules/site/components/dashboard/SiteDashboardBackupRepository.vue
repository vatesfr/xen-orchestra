<template>
  <div class="site-dashboard-backup-repository">
    <UiCardTitle>
      {{ t('backup-repository') }}
      <template #description>{{ t('for-backup') }}</template>
    </UiCardTitle>
    <!--    TODO change and add loading when we have isReady available -->
    <VtsStateHero v-if="!areBackupRepositoriesReady" format="card" type="no-data" size="extra-small" horizontal>
      {{ t('no-data-to-calculate') }}
    </VtsStateHero>
    <VtsStateHero v-else-if="hasError" format="card" type="error" size="extra-small" horizontal>
      {{ t('error-no-data') }}
    </VtsStateHero>
    <template v-else>
      <VtsStackedBarWithLegend :max-value="maxValue" :segments />
      <div class="numbers">
        <UiCardNumbers
          :value="repositories?.used?.value"
          :unit="repositories?.used?.prefix"
          :label="t('used')"
          size="medium"
        />
        <UiCardNumbers
          :value="repositories?.available?.value"
          :unit="repositories?.available?.prefix"
          :label="t('available')"
          size="medium"
        />
        <UiCardNumbers
          :value="repositories?.total?.value"
          :unit="repositories?.total?.prefix"
          :label="t('total')"
          size="medium"
        />
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import type { BackupRepositories } from '@/modules/site/remote-resources/use-xo-site-dashboard.ts'
import VtsStackedBarWithLegend, {
  type StackedBarWithLegendProps,
} from '@core/components/stacked-bar-with-legend/VtsStackedBarWithLegend.vue'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import UiCardNumbers from '@core/components/ui/card-numbers/UiCardNumbers.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import { computed, type ComputedRef } from 'vue'
import { useI18n } from 'vue-i18n'

const { repositories } = defineProps<{
  repositories: BackupRepositories | undefined
  hasError?: boolean
}>()

const { t } = useI18n()

const areBackupRepositoriesReady = computed(() => repositories !== undefined)

const segments: ComputedRef<StackedBarWithLegendProps['segments']> = computed(() => [
  {
    label: t('xo-backups'),
    value: repositories?.backups.value ?? 0,
    accent: 'info',
    unit: repositories?.backups.prefix,
  },
  {
    label: t('other'),
    value: repositories?.other?.value ?? 0,
    accent: 'warning',
    unit: repositories?.other?.prefix,
  },
])

const maxValue = computed(() => ({
  value: repositories?.total?.value,
  unit: repositories?.total?.prefix,
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
