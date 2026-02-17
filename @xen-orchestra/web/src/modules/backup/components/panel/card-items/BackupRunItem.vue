<template>
  <VtsCardRowKeyValue>
    <template #key>
      {{ t('run') }}
    </template>
    <template #value>
      <UiLink
        v-if="backupRun.id"
        size="small"
        icon="object:backup-run"
        :to="{ name: '/backup/[id]/runs', params: { id: backupRun.jobId }, query: { id: backupRun.id } }"
      >
        {{ backupRun.id }}
      </UiLink>
    </template>
    <template #addons>
      <VtsCopyButton :value="backupRun.id" />
    </template>
  </VtsCardRowKeyValue>
  <VtsCardRowKeyValue>
    <template #key>
      {{ t('date') }}
    </template>
    <template #value>
      {{ formattedRunDate }}
    </template>
    <template #addons>
      <VtsCopyButton :value="formattedRunDate" />
    </template>
  </VtsCardRowKeyValue>
  <VtsCardRowKeyValue>
    <template #key>
      {{ t('status') }}
    </template>
    <template #value>
      <VtsStatus :status="backupRun.status" />
    </template>
  </VtsCardRowKeyValue>
  <VtsCardRowKeyValue>
    <template #key>
      {{ t('schedule') }}
    </template>
    <template #value>
      <UiLink size="small" icon="object:backup-schedule" :href>
        {{ scheduleName || backupRun.jobId }}
      </UiLink>
    </template>
  </VtsCardRowKeyValue>
  <UiLogEntryViewer
    v-if="logContent"
    :content="logContent"
    :label="t('api-error-details')"
    size="small"
    :accent="backupRun.status === 'skipped' ? 'warning' : 'danger'"
  />
</template>

<script lang="ts" setup>
import type { FrontXoBackupLog } from '@/modules/backup/remote-resources/use-xo-backup-log-collection.ts'
import { useXoScheduleCollection } from '@/modules/schedule/remote-resources/use-xo-schedule-collection.ts'
import { useXoRoutes } from '@/shared/remote-resources/use-xo-routes.ts'
import VtsCardRowKeyValue from '@core/components/card/VtsCardRowKeyValue.vue'
import VtsCopyButton from '@core/components/copy-button/VtsCopyButton.vue'
import VtsStatus from '@core/components/status/VtsStatus.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import UiLogEntryViewer from '@core/components/ui/log-entry-viewer/UiLogEntryViewer.vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { backupRun } = defineProps<{
  backupRun: FrontXoBackupLog
}>()

const { t, d } = useI18n()

const { buildXo5Route } = useXoRoutes()
const href = computed(() => buildXo5Route(`/backup/${backupRun.jobId}/edit`))

const { schedules } = useXoScheduleCollection()

const runDate = computed(() => backupRun.end ?? backupRun.start)

const formattedRunDate = computed(() => d(runDate.value, 'datetime_short'))

const logContent = computed(() => {
  if (backupRun.status !== 'success' && backupRun.status !== 'pending' && backupRun.tasks && backupRun.tasks[0]) {
    return backupRun.tasks[0].result?.stack
  }

  return undefined
})

const scheduleName = computed(() => schedules.value.find(schedule => schedule.jobId === backupRun.jobId)?.name)
</script>
