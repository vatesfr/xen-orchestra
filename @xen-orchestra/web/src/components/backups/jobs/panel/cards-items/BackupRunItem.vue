<template>
  <UiLabelValue :label="t('run')">
    <template #value>
      <UiLink v-if="backupRun.id" size="small" icon="object:backup-log">
        {{ backupRun.id }}
      </UiLink>
    </template>
    <template #actions>
      <VtsCopyButton :value="backupRun.id" />
    </template>
  </UiLabelValue>
  <UiLabelValue :label="t('date')" :value="formattedRunDate">
    <template #actions>
      <VtsCopyButton :value="formattedRunDate" />
    </template>
  </UiLabelValue>
  <UiLabelValue :label="t('status')">
    <template #value>
      <VtsBackupState :state="backupRun.status" />
    </template>
  </UiLabelValue>
  <UiLabelValue :label="t('schedule')">
    <template #value>
      <UiLink size="small" icon="object:backup-schedule" :href="`/#/backup/${backupRun.jobId}/edit`">
        {{ scheduleName || backupRun.jobId }}
      </UiLink>
    </template>
  </UiLabelValue>
  <UiLogEntryViewer
    v-if="logContent"
    :content="logContent"
    :label="t('api-error-details')"
    size="small"
    :accent="backupRun.status === 'skipped' ? 'warning' : 'danger'"
  />
</template>

<script lang="ts" setup>
import { useXoScheduleCollection } from '@/remote-resources/use-xo-schedule-collection.ts'
import type { XoBackupLog } from '@/types/xo/backup-log.type.ts'
import VtsBackupState from '@core/components/backup-state/VtsBackupState.vue'
import VtsCopyButton from '@core/components/copy-button/VtsCopyButton.vue'
import UiLabelValue from '@core/components/ui/label-value/UiLabelValue.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import UiLogEntryViewer from '@core/components/ui/log-entry-viewer/UiLogEntryViewer.vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { backupRun } = defineProps<{
  backupRun: XoBackupLog
}>()

const { t } = useI18n()

const { schedules } = useXoScheduleCollection()

const runDate = computed(() => backupRun.end ?? backupRun.start)

const formattedRunDate = computed(() => new Date(runDate.value).toLocaleString())

const logContent = computed(() => {
  if (backupRun.status !== 'success' && backupRun.status !== 'pending' && backupRun.tasks && backupRun.tasks[0]) {
    return backupRun.tasks[0].result.stack
  }

  return undefined
})

const scheduleName = computed(() => schedules.value.find(schedule => schedule.jobId === backupRun.jobId)?.name)
</script>
