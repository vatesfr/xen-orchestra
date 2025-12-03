<template>
  <UiCard>
    <UiCardTitle>
      {{ t('backup-issues') }}
      <UiCounter :value="nBackupIssues" accent="danger" size="medium" variant="primary" />
      <template #description>{{ t('in-last-three-jobs') }}</template>
    </UiCardTitle>
    <div class="backup-items">
      <VtsTable :state>
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
import type { BackupIssue, XoDashboard } from '@/types/xo/dashboard.type.ts'
import VtsRow from '@core/components/table/VtsRow.vue'
import VtsTable from '@core/components/table/VtsTable.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import UiCounter from '@core/components/ui/counter/UiCounter.vue'
import { useTableState } from '@core/composables/table-state.composable'
import { useBackupIssueColumns } from '@core/tables/column-sets/backup-issue-columns'
import { logicNot } from '@vueuse/math'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { issues: rawIssues } = defineProps<{
  issues: NonNullable<XoDashboard['backups']>['issues'] | undefined
}>()

const { t } = useI18n()

const areBackupIssuesReady = computed(() => rawIssues !== undefined)

const backupIssues = computed(() => rawIssues ?? [])

const nBackupIssues = computed(() => backupIssues.value.length)

const hasBackupIssues = computed(() => nBackupIssues.value > 0)

const state = useTableState({
  busy: logicNot(areBackupIssuesReady),
  empty: () =>
    !hasBackupIssues.value ? { type: 'no-data', message: t('no-data-to-calculate'), size: 'small' } : false,
})

const { HeadCells, BodyCells } = useBackupIssueColumns({
  body: (issue: BackupIssue) => ({
    job: r => r({ label: issue.name ?? '', icon: 'fa:floppy-disk' }),
    lastRun: r => r(issue.logs[0]),
    secondLastRun: r => r(issue.logs[1]),
    thirdLastRun: r => r(issue.logs[2]),
  }),
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
