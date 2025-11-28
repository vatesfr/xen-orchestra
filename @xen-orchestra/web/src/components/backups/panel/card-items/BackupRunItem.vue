<template>
  <VtsCardRowKeyValue>
    <template #key>
      {{ t('run') }}
    </template>
    <template #value>
      <UiLink
        v-if="backupRun.id"
        size="small"
        icon="object:backup-log"
        :to="`/backup/${backupRun.jobId}/runs?id=${backupRun.id}`"
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
      <UiLink size="small" icon="object:backup-schedule" :href="`${xo5Route}#/backup/${backupRun.jobId}/edit`">
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
import { useXoRoutes } from '@/remote-resources/use-xo-routes.ts'
import { useXoScheduleCollection } from '@/remote-resources/use-xo-schedule-collection.ts'
import VtsCardRowKeyValue from '@core/components/card/VtsCardRowKeyValue.vue'
import VtsCopyButton from '@core/components/copy-button/VtsCopyButton.vue'
import VtsStatus from '@core/components/status/VtsStatus.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import UiLogEntryViewer from '@core/components/ui/log-entry-viewer/UiLogEntryViewer.vue'
import type { XoBackupLog } from '@vates/types'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { backupRun } = defineProps<{
  backupRun: XoBackupLog
}>()

const { t, d } = useI18n()

const { routes } = useXoRoutes()
const xo5Route = computed(() => routes.value?.xo5 ?? '/')

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
