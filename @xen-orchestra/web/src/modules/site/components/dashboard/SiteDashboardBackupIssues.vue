<template>
  <UiCard>
    <UiCardTitle>
      {{ t('backups:jobs:issues') }}
      <UiCounter v-if="hasBackupIssues" :value="nBackupIssues" accent="danger" size="medium" variant="primary" />
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
import type { BackupIssue, XoDashboard } from '@/modules/site/types/xo-dashboard.type.ts'
import { useXoBackupJobIssuesUtils } from '@/composables/xo-backup-job-issues.composable.ts'
import VtsRow from '@core/components/table/VtsRow.vue'
import VtsTable from '@core/components/table/VtsTable.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import UiCounter from '@core/components/ui/counter/UiCounter.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import { useTableState } from '@core/composables/table-state.composable'
import { useBackupIssueColumns } from '@core/tables/column-sets/backup-issue-columns'
import { logicNot } from '@vueuse/math'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { backups } = defineProps<{
  backups: XoDashboard['backups'] | undefined
}>()

const { t } = useI18n()

const { getLastRunsInfo } = useXoBackupJobIssuesUtils()

const areBackupIssuesReady = computed(() => backups?.issues !== undefined)

const backupIssues = computed(() => backups?.issues ?? [])

const nBackupIssues = computed(() => backupIssues.value.length)

const hasBackupIssues = computed(() => nBackupIssues.value > 0)

const hasBackupJobs = computed(() => (backups?.jobs?.total ?? 0) > 0)

const state = useTableState({
  busy: logicNot(areBackupIssuesReady),
  empty: () =>
    !hasBackupIssues.value && !hasBackupJobs.value
      ? { type: 'no-data', message: t('no-data-to-calculate'), size: 'extra-small' }
      : !hasBackupIssues.value && hasBackupJobs.value
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
