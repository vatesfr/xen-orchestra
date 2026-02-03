<template>
  <UiCard :has-error="isError">
    <UiCardTitle>
      {{ t('backups:jobs:issues') }}
      <UiCounter
        v-if="hasBackupIssues || isError"
        :value="nBackupIssues"
        accent="danger"
        size="medium"
        variant="primary"
      />
      <template v-if="hasBackupIssues" #info>
        <!-- TODO Need to be Filter on “Last 3 backups”: “Skipped runs, no errors”, “Errors detected “ -->
        <UiLink size="small" :to="{ name: '/(site)/backups' }">{{ t('action:see-all') }}</UiLink>
      </template>
      <template #description>{{ t('in-last-three-runs') }}</template>
    </UiCardTitle>
    <div class="backup-items">
      <VtsTable :state horizontal>
        <thead>
          <HeadCells />
        </thead>
        <tbody>
          <VtsRow v-for="issue of backupIssues" :key="issue.uuid">
            <BodyCells :item="issue" />
          </VtsRow>
        </tbody>
      </VtsTable>
    </div>
  </UiCard>
</template>

<script lang="ts" setup>
import { useXoSiteDashboard } from '@/modules/site/remote-resources/use-xo-site-dashboard.ts'
import type { BackupIssue } from '@/modules/site/types/xo-dashboard.type.ts'
import VtsRow from '@core/components/table/VtsRow.vue'
import VtsTable from '@core/components/table/VtsTable.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import UiCounter from '@core/components/ui/counter/UiCounter.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import { useTableState } from '@core/composables/table-state.composable'
import { createMapper } from '@core/packages/mapper'
import { useBackupIssueColumns } from '@core/tables/column-sets/backup-issue-columns'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { dashboard, hasError } = useXoSiteDashboard()

const { t } = useI18n()

const dashboardBackups = computed(() => dashboard.value.backups)

const isLoading = computed(() => dashboardBackups.value === undefined)

const isError = computed(
  () => hasError.value || (dashboardBackups.value !== undefined && 'error' in dashboardBackups.value)
)

const isEmpty = computed(() => dashboardBackups.value !== undefined && 'isEmpty' in dashboardBackups.value)

const backupIssues = computed(() => {
  if (!dashboardBackups.value || !('issues' in dashboardBackups.value)) {
    return
  }

  return dashboardBackups.value?.issues
})

const nBackupIssues = computed(() => backupIssues.value?.length ?? 0)

const hasBackupIssues = computed(() => nBackupIssues.value > 0)

const state = useTableState({
  busy: isLoading,
  error: () => (isError.value ? { type: 'error', message: t('error-no-data'), size: 'extra-small' } : false),
  empty: () =>
    isEmpty.value
      ? { type: 'no-data', message: t('no-data-to-calculate'), size: 'extra-small' }
      : !hasBackupIssues.value
        ? {
            type: 'all-good',
            message: t('backups:jobs:issues-ran-without-hitch'),
            size: 'extra-small',
            horizontal: true,
          }
        : false,
})

const getStatusLabel = createMapper<BackupIssue['logs'][number] | 'unknown', string>(
  {
    success: t('success'),
    failure: t('failure'),
    interrupted: t('interrupted'),
    skipped: t('skipped'),
    unknown: '',
  },
  'unknown'
)

function getLastRunsInfo(backupIssue: BackupIssue) {
  return backupIssue.logs.map((status, index) => ({
    status,
    tooltip: `${t('last-run-number', { n: index + 1 })}: ${getStatusLabel(status)}`,
  }))
}

const { HeadCells, BodyCells } = useBackupIssueColumns({
  body: (issue: BackupIssue) => {
    const lastRuns = getLastRunsInfo(issue)

    return {
      job: r =>
        r({
          label: issue.name ?? t('untitled'),
          to: `/backup/${issue.uuid}/runs`,
          icon: 'object:backup-job',
        }),
      lastRuns: r => r(lastRuns),
    }
  },
})
</script>

<style lang="postcss" scoped>
.backup-items {
  max-height: 30rem;
  overflow-y: auto;
  margin-inline: -2.4rem;
  margin-block-end: -2.4rem;
}
</style>
