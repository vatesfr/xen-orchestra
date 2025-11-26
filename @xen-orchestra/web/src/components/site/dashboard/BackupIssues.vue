<template>
  <UiCard :has-error>
    <UiCardTitle>
      {{ t('backup-issues') }}
      <UiCounter :value="nBackupIssues" accent="danger" size="medium" variant="primary" />
      <template #description>{{ t('in-last-three-jobs') }}</template>
    </UiCardTitle>
    <div class="backup-items">
      <VtsTableNew :busy="!areBackupIssuesReady" :empty="!hasBackupIssues">
        <thead>
          <HeadCells />
        </thead>
        <tbody>
          <VtsRow v-for="issue of backupIssues" :key="issue.uuid">
            <BodyCells :item="issue" />
          </VtsRow>
        </tbody>
      </VtsTableNew>
    </div>
  </UiCard>
</template>

<script lang="ts" setup>
import type { BackupIssue, XoDashboard } from '@/types/xo/dashboard.type.ts'
import VtsRow from '@core/components/table/VtsRow.vue'
import VtsTableNew from '@core/components/table/VtsTableNew.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import UiCounter from '@core/components/ui/counter/UiCounter.vue'
import { useBackupIssueColumns } from '@core/tables/column-sets/backup-issue-columns'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { issues: rawIssues } = defineProps<{
  issues: NonNullable<XoDashboard['backups']>['issues'] | undefined
  hasError?: boolean
}>()

const { t } = useI18n()

const areBackupIssuesReady = computed(() => rawIssues !== undefined)

const backupIssues = computed(() => rawIssues ?? [])

const nBackupIssues = computed(() => backupIssues.value.length)

const hasBackupIssues = computed(() => nBackupIssues.value > 0)

const { HeadCells, BodyCells } = useBackupIssueColumns({
  body: (issue: BackupIssue) => ({
    name: r => r({ label: issue.name ?? '', icon: 'fa:floppy-disk' }),
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

  .name {
    display: flex;
    align-items: center;
    gap: 0.8rem;
  }

  .logs {
    max-width: 1.5rem;
  }
}
</style>
