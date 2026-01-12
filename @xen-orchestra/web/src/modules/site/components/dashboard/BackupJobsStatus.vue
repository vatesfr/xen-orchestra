<template>
  <UiCard :has-error="error">
    <UiCardTitle>
      {{ t('backups:jobs:status') }}
      <template v-if="!areBackupsJobsEmpty" #info>
        <UiLink size="small" :to="{ name: '/(site)/backups' }"> {{ t('action:see-all') }}</UiLink>
      </template>
      <template v-if="!areBackupsJobsEmpty" #description>{{ t('backups:jobs:last-seven-days') }}</template>
    </UiCardTitle>
    <VtsStateHero v-if="!areBackupsJobsReady" format="card" type="busy" size="medium" />
    <VtsStateHero v-else-if="error" format="card" type="error" size="medium">
      {{ t('error-no-data') }}
    </VtsStateHero>
    <UiAlert v-else-if="areBackupsJobsEmpty" accent="warning">
      <span class="typo-body-bold">{{ t('no-active-backup-jobs') }}</span>
      <template #description>
        <I18nT keypath="configure-for-protected" scope="global" tag="div">
          <template #backup-job>
            <UiLink size="small" :to="{ name: '/(site)/backups' }">
              {{ t('backup-job') }}
            </UiLink>
          </template>
        </I18nT>
      </template>
    </UiAlert>
    <template v-else>
      <VtsDonutChartWithLegend icon="object:backup-job" :segments="jobsSegments" />
      <UiCardNumbers :label="t('total')" :value="backups?.jobs.total" size="small" />
    </template>
  </UiCard>
</template>

<script lang="ts" setup>
<<<<<<<< HEAD:@xen-orchestra/web/src/modules/site/components/dashboard/SiteDashboardBackups.vue
import type { XoDashboard } from '@/modules/site/types/xo-dashboard.type.ts'
import VtsDivider from '@core/components/divider/VtsDivider.vue'
========
import type { XoDashboard } from '@/types/xo/dashboard.type.ts'
>>>>>>>> 0a8adb77a (feat(xo6): update site dashboard):@xen-orchestra/web/src/modules/site/components/dashboard/BackupJobsStatus.vue
import VtsDonutChartWithLegend, {
  type DonutChartWithLegendProps,
} from '@core/components/donut-chart-with-legend/VtsDonutChartWithLegend.vue'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import UiAlert from '@core/components/ui/alert/UiAlert.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCardNumbers from '@core/components/ui/card-numbers/UiCardNumbers.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { backups, hasError, isReady } = defineProps<{
  backups: XoDashboard['backups'] | undefined
  hasError?: boolean
  isReady?: boolean
}>()

const areBackupsJobsReady = computed(() => backups?.jobs !== undefined)

const areBackupsJobsEmpty = computed(() => backups?.jobs.total === 0)

const error = computed(() => hasError || (backups?.jobs === undefined && isReady))

const { t } = useI18n()

const jobsSegments = computed<DonutChartWithLegendProps['segments']>(() => [
  {
    label: t('backups:jobs:running-good'),
    value: backups?.jobs.successful ?? 0,
    accent: 'success',
  },
  {
    label: t('backups:jobs:skipped-runs'),
    value: backups?.jobs.skipped ?? 0,
    accent: 'warning',
  },
  {
    label: t('backups:jobs:errors-detected'),
    value: backups?.jobs.failed ?? 0,
    accent: 'danger',
  },
  {
    label: t('backups:jobs:no-recent-run'),
    value: backups?.jobs.noRecentRun ?? 0,
    accent: 'info',
  },
])
</script>
