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
        <UiLink size="small" :to="{ name: '/(site)/backups' }"> {{ t('action:see-all') }}</UiLink>
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
import { useXoBackupJobIssuesUtils } from '@/shared/composables/xo-backup-job-issues.composable.ts'
import VtsRow from '@core/components/table/VtsRow.vue'
import VtsTable from '@core/components/table/VtsTable.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import UiCounter from '@core/components/ui/counter/UiCounter.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import { useTableState } from '@core/composables/table-state.composable'
import { useBackupIssueColumns } from '@core/tables/column-sets/backup-issue-columns'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { dashboard, hasError } = useXoSiteDashboard()

const { t } = useI18n()

const { getLastRunsInfo } = useXoBackupJobIssuesUtils()

const isLoading = computed(() => dashboard.value.backups === undefined)

const isError = computed(() => hasError.value || (!isLoading.value && 'error' in dashboard.value.backups!))

const isEmpty = computed(() => !isLoading.value && 'isEmpty' in dashboard.value.backups!)

const backupIssues = computed(() => {
  if (isLoading.value || !('issues' in dashboard.value.backups!)) {
    return
  }

  return dashboard.value.backups.issues
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
        ? { type: 'all-good', message: t('backups:jobs:issues-ran-without-hitch'), size: 'extra-small' }
        : false,
})

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
