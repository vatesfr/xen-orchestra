<template>
  <UiPanelCard class="backup-log-task-quick-infos-card">
    <UiPanelCardTitle :id="task.id" size="medium" :label="taskName.name" :to="taskName.to" icon="fa:bars-progress" />
    <div class="content">
      <VtsCardRowKeyValue v-if="type !== undefined">
        <template #key>{{ t('type') }}</template>
        <template #value>{{ type }}</template>
        <template #addons>
          <VtsCopyButton :value="type" />
        </template>
      </VtsCardRowKeyValue>
      <VtsCardRowKeyValue>
        <template #key>{{ t('duration') }}</template>
        <template #value>{{ duration }}</template>
        <template v-if="duration !== undefined" #addons>
          <VtsCopyButton :value="duration" />
        </template>
      </VtsCardRowKeyValue>
      <VtsCardRowKeyValue v-if="speed !== undefined">
        <template #key>{{ t('speed') }}</template>
        <template #value>{{ speed }}</template>
        <template #addons>
          <VtsCopyButton :value="speed" />
        </template>
      </VtsCardRowKeyValue>
      <VtsCardRowKeyValue v-if="size !== undefined">
        <template #key>{{ t('size') }}</template>
        <template #value>{{ size }}</template>
        <template #addons>
          <VtsCopyButton :value="size" />
        </template>
      </VtsCardRowKeyValue>
      <VtsCardRowKeyValue>
        <template #key>{{ t('task:started') }}</template>
        <template #value>{{ startDate }}</template>
      </VtsCardRowKeyValue>
      <VtsCardRowKeyValue>
        <template #key>{{ t('task:ended') }}</template>
        <template #value>{{ endDate ?? '-' }}</template>
      </VtsCardRowKeyValue>
      <VtsCardRowKeyValue>
        <template #key>{{ t('status') }}</template>
        <template #value>
          <UiTagsList>
            <UiTag :accent="taskAccent" variant="secondary">
              {{ task.status }}
            </UiTag>
          </UiTagsList>
        </template>
        <template #addons>
          <UiCircleProgressBar :accent="progressAccent" size="small" :value="progress" />
        </template>
      </VtsCardRowKeyValue>
    </div>
  </UiPanelCard>
</template>

<script lang="ts" setup>
import { useXoBackupLogTaskName } from '@/modules/backup-log/composables/use-xo-backup-log-task-name.composable.ts'
import {
  type BackupLogTask,
  useXoBackupLogsUtils,
} from '@/modules/backup-log/composables/use-xo-backup-log-utils.composable.ts'
import { computeTransferSpeed } from '@/modules/backup-log/utils/xo-backup-log-transfer-speed.util.ts'
import { getTaskAccents } from '@/modules/task/utils/xo-task.util.ts'
import VtsCardRowKeyValue from '@core/components/card/VtsCardRowKeyValue.vue'
import VtsCopyButton from '@core/components/copy-button/VtsCopyButton.vue'
import UiCircleProgressBar from '@core/components/ui/circle-progress-bar/UiCircleProgressBar.vue'
import UiPanelCard from '@core/components/ui/panel-card/UiPanelCard.vue'
import UiPanelCardTitle from '@core/components/ui/panel-card-title/UiPanelCardTitle.vue'
import UiTag from '@core/components/ui/tag/UiTag.vue'
import UiTagsList from '@core/components/ui/tag/UiTagsList.vue'
import { formatSize } from '@core/utils/size.util.ts'
import { formatSpeed } from '@core/utils/speed.util.ts'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { task } = defineProps<{
  task: BackupLogTask
}>()

const { t } = useI18n()

const { getTaskName } = useXoBackupLogTaskName()

const { getBackupLogDate, getBackupLogDuration, findVmTransfer } = useXoBackupLogsUtils()

const taskName = computed(() => getTaskName(task))

const type = computed(() => {
  let isFull: unknown = task.data?.isFull

  if (task.data?.type === 'VM') {
    const exportTask = task.tasks?.find(subTask => subTask.data?.isFull !== undefined)
    isFull = exportTask?.data?.isFull
  }

  if (isFull === undefined) {
    return undefined
  }

  return isFull ? t('full') : t('incremental')
})

const duration = computed(() => getBackupLogDuration(task.start, task.end))

const transfer = computed(() => {
  if (task.data?.type === 'VM') {
    return findVmTransfer(task)
  }

  if (task.message === 'transfer' && typeof task.result?.size === 'number') {
    return { size: task.result.size, start: task.start, end: task.end }
  }

  return undefined
})

const size = computed(() => (transfer.value !== undefined ? formatSize(transfer.value.size, 2) : undefined))

const speed = computed(() => {
  if (transfer.value === undefined) {
    return undefined
  }

  const bytesPerSecond = computeTransferSpeed(transfer.value.size, transfer.value.start, transfer.value.end)

  return bytesPerSecond !== undefined ? formatSpeed(bytesPerSecond) : undefined
})

const startDate = computed(() => getBackupLogDate(task.start))

const endDate = computed(() => getBackupLogDate(task.end))

const taskAccent = computed(() => getTaskAccents(task.status).statusAccent)

const progressAccent = computed(() => getTaskAccents(task.status).progressAccent)

const progress = computed(() => {
  const dataProgress = typeof task.data?.progress === 'number' ? task.data.progress : undefined

  if (task.status === 'pending' && !task.end) {
    return dataProgress ?? 0
  }

  return dataProgress ?? 100
})
</script>

<style scoped lang="postcss">
.backup-log-task-quick-infos-card {
  .content {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }
}
</style>
