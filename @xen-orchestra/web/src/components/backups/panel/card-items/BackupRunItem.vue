<template>
  <UiLabelValue :label="t('run')" :copy-value="backupRun.id" ellipsis>
    <template #value>
      <UiLink
        v-if="backupRun.id"
        size="small"
        icon="object:backup-log"
        :to="`/backup/${backupRun.jobId}/runs?id=${backupRun.id}`"
        class="link"
      >
        <div v-tooltip class="text-ellipsis">
          {{ backupRun.id }}
        </div>
      </UiLink>
    </template>
  </UiLabelValue>
  <UiLabelValue :label="t('date')" :value="formattedRunDate" :copy-value="formattedRunDate" ellipsis />
  <UiLabelValue :label="t('status')" ellipsis>
    <template #value>
      <VtsStatus :status="backupRun.status" />
    </template>
  </UiLabelValue>
  <UiLabelValue :label="t('schedule')" ellipsis>
    <template #value>
      <UiLink size="small" icon="object:backup-schedule" :href="`/#/backup/${backupRun.jobId}/edit`" class="link">
        <div v-tooltip class="text-ellipsis">
          {{ scheduleName || backupRun.jobId }}
        </div>
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
import VtsStatus from '@core/components/status/VtsStatus.vue'
import UiLabelValue from '@core/components/ui/label-value/UiLabelValue.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import UiLogEntryViewer from '@core/components/ui/log-entry-viewer/UiLogEntryViewer.vue'
import { vTooltip } from '@core/directives/tooltip.directive'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { backupRun } = defineProps<{
  backupRun: XoBackupLog
}>()

const { t, d } = useI18n()

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

<style lang="postcss" scoped>
.link {
  width: 100%;
}
</style>
