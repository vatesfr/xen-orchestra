<template>
  <VtsCardRowKeyValue>
    <template #key>{{ t('run') }}</template>
    <template #value>
      <UiLink
        size="small"
        icon="object:backup-run"
        :to="{ name: '/admin/backup-and-replication/logs', query: { id: backupRun.id } }"
      >
        {{ backupRun.id }}
      </UiLink>
    </template>
    <template #addons>
      <VtsCopyButton :value="backupRun.id" />
    </template>
  </VtsCardRowKeyValue>
  <VtsCardRowKeyValue>
    <template #key>{{ t('date') }}</template>
    <template #value>{{ formattedRunDate }}</template>
    <template #addons>
      <VtsCopyButton :value="formattedRunDate" />
    </template>
  </VtsCardRowKeyValue>
  <VtsCardRowKeyValue>
    <template #key>{{ t('status') }}</template>
    <template #value>
      <VtsStatus :status="backupRun.status" />
    </template>
  </VtsCardRowKeyValue>
  <VtsCardRowKeyValue>
    <template #key>{{ t('schedule') }}</template>
    <template #value>
      <UiLink v-if="schedule !== undefined" size="small" icon="object:backup-schedule" :href="jobOverviewHref">
        {{ scheduleName }}
      </UiLink>
      <template v-else>{{ scheduleName }}</template>
    </template>
    <template v-if="scheduleName" #addons>
      <VtsCopyButton :value="scheduleName" />
    </template>
  </VtsCardRowKeyValue>
  <UiLogEntryViewer
    v-if="backupRunError !== undefined"
    :content="backupRunError"
    :label="errorViewer.label"
    size="small"
    :accent="errorViewer.accent"
  />
</template>

<script lang="ts" setup>
import type { FrontXoBackupLog } from '@/modules/backup-log/remote-resources/use-xo-backup-log-collection.ts'
import { getBackupLogError } from '@/modules/backup-log/utils/xo-backup-log.util.ts'
import {
  type FrontXoSchedule,
  useXoScheduleCollection,
} from '@/modules/schedule/remote-resources/use-xo-schedule-collection.ts'
import { useXoRoutes } from '@/shared/remote-resources/use-xo-routes.ts'
import VtsCardRowKeyValue from '@core/components/card/VtsCardRowKeyValue.vue'
import VtsCopyButton from '@core/components/copy-button/VtsCopyButton.vue'
import VtsStatus from '@core/components/status/VtsStatus.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import UiLogEntryViewer from '@core/components/ui/log-entry-viewer/UiLogEntryViewer.vue'
import { formatDateTime } from '@core/utils/time.util.ts'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { backupRun } = defineProps<{
  backupRun: FrontXoBackupLog
}>()

const { t } = useI18n()

const { buildXo5Route } = useXoRoutes()

const { useGetScheduleById } = useXoScheduleCollection()

const scheduleId = computed(() => backupRun.scheduleId as FrontXoSchedule['id'] | undefined)

const schedule = useGetScheduleById(scheduleId)

const scheduleName = computed(() => {
  if (schedule.value === undefined) {
    return scheduleId.value ?? ''
  }

  return schedule.value.name || t('untitled')
})

const jobOverviewHref = computed(() => buildXo5Route('/backup/overview'))

const formattedRunDate = computed(() => formatDateTime(backupRun.end ?? backupRun.start))

const errorViewer = computed(() =>
  backupRun.status === 'skipped'
    ? { label: t('api-warning-details'), accent: 'warning' as const }
    : { label: t('api-error-details'), accent: 'danger' as const }
)

const backupRunError = computed(() => {
  const error = getBackupLogError(backupRun)

  if (error !== undefined) {
    return error
  }

  switch (backupRun.status) {
    case 'failure':
      return t('unknown-error')
    case 'interrupted':
      return t('run-interrupted')
    default:
      return undefined
  }
})
</script>
