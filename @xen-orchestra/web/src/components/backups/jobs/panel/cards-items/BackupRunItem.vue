<template>
  <VtsCardRowKeyValue>
    <template #key>
      {{ t('run') }}
    </template>
    <template #value>
      <UiLink v-if="backupRun.id" size="small" icon="object:backup-log">
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
      <VtsBackupState :state="backupRun.status" />
    </template>
  </VtsCardRowKeyValue>
  <VtsCardRowKeyValue>
    <template #key>
      {{ t('schedule') }}
    </template>
    <template #value>
      <UiLink
        v-if="scheduleName"
        size="small"
        icon="object:backup-schedule"
        :href="`/#/backup/${backupRun.jobId}/edit`"
      >
        {{ scheduleName }}
      </UiLink>
    </template>
  </VtsCardRowKeyValue>
  <UiLogEntryViewer
    v-if="shouldShowLog"
    :content="backupRun.tasks![0].result.stack as string"
    :label="t('api-error-details')"
    size="small"
    :accent="backupRun.status === 'skipped' ? 'warning' : 'danger'"
  />
</template>

<script lang="ts" setup>
import { useXoScheduleCollection } from '@/remote-resources/use-xo-schedule-collection.ts'
import type { XoBackupLog } from '@/types/xo/backup-log.type.ts'
import VtsBackupState from '@core/components/backup-state/VtsBackupState.vue'
import VtsCardRowKeyValue from '@core/components/card/VtsCardRowKeyValue.vue'
import VtsCopyButton from '@core/components/copy-button/VtsCopyButton.vue'
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

const shouldShowLog = computed(
  () => backupRun.status !== 'success' && backupRun.status !== 'pending' && backupRun.tasks && backupRun.tasks[0].result
)

const scheduleName = computed(() => schedules.value.filter(schedule => schedule.jobId === backupRun.jobId)[0]?.name)
</script>
