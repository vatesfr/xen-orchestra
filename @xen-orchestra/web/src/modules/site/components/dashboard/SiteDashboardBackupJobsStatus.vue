<template>
  <UiCard :has-error="isError">
    <UiCardTitle>
      {{ t('backups:jobs:status') }}
      <template v-if="!isEmpty" #info>
        <UiLink size="small" :to="{ name: '/(site)/backups' }"> {{ t('action:see-all') }}</UiLink>
      </template>
      <template v-if="!isEmpty" #description>{{ t('backups:jobs:last-seven-days') }}</template>
    </UiCardTitle>
    <VtsStateHero v-if="isLoading" format="card" type="busy" size="medium" />
    <VtsStateHero v-else-if="isError" format="card" type="error" size="medium">
      {{ t('error-no-data') }}
    </VtsStateHero>
    <UiAlert v-else-if="isEmpty" accent="warning">
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
      <UiCardNumbers :label="t('total')" :value="backupJobs?.total" size="small" />
    </template>
  </UiCard>
</template>

<script lang="ts" setup>
import { useXoSiteDashboard } from '@/modules/site/remote-resources/use-xo-site-dashboard.ts'
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

const { dashboard, hasError } = useXoSiteDashboard()

const { t } = useI18n()

const isLoading = computed(() => dashboard.value.backups === undefined)

const isError = computed(() => hasError.value || (!isLoading.value && 'error' in dashboard.value.backups!))

const isEmpty = computed(() => !isLoading.value && 'isEmpty' in dashboard.value.backups!)

const backupJobs = computed(() => {
  if (isLoading.value || !('jobs' in dashboard.value.backups!)) {
    return
  }

  return dashboard.value.backups.jobs
})

const jobsSegments = computed<DonutChartWithLegendProps['segments']>(() => [
  {
    label: t('backups:jobs:running-good'),
    value: backupJobs.value?.successful ?? 0,
    accent: 'success',
  },
  {
    label: t('backups:jobs:skipped-runs'),
    value: backupJobs.value?.skipped ?? 0,
    accent: 'warning',
  },
  {
    label: t('backups:jobs:errors-detected'),
    value: backupJobs.value?.failed ?? 0,
    accent: 'danger',
  },
  {
    label: t('backups:jobs:no-recent-run'),
    value: backupJobs.value?.noRecentRun ?? 0,
    accent: 'info',
  },
])
</script>
