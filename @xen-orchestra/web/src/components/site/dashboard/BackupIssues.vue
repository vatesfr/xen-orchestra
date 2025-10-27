<template>
  <UiCard :has-error>
    <UiCardTitle>
      {{ t('backup-issues') }}
      <UiCounter :value="nBackupIssues" accent="danger" size="medium" variant="primary" />
      <template #description>{{ t('in-last-three-jobs') }}</template>
    </UiCardTitle>
    <BackupIssuesTable />
  </UiCard>
</template>

<script lang="ts" setup>
import type { XoDashboard } from '@/types/xo/dashboard.type.ts'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import UiCounter from '@core/components/ui/counter/UiCounter.vue'
import { useBackupIssuesTable } from '@core/tables/use-backup-issues-table'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { issues, hasError } = defineProps<{
  issues: NonNullable<XoDashboard['backups']>['issues'] | undefined
  hasError?: boolean
}>()

const { t } = useI18n()

const areBackupIssuesReady = computed(() => issues !== undefined)

const backupIssues = computed(() => issues ?? [])

const nBackupIssues = computed(() => backupIssues.value.length)

const BackupIssuesTable = useBackupIssuesTable(backupIssues, {
  ready: areBackupIssuesReady,
  empty: computed(() => backupIssues.value.length === 0),
  error: computed(() => hasError === true),
  transform: issue => ({ name: issue.name ?? '' }),
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
