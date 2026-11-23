<template>
  <UiCard>
    <UiTitle>
      {{ t('general-information') }}
    </UiTitle>
    <VtsTabularKeyValueList>
      <VtsTabularKeyValueRow :label="t('uuid')">
        <template #value>
          <VtsCodeSnippet :content="backupLog.id" />
        </template>
      </VtsTabularKeyValueRow>
      <VtsTabularKeyValueRow :label="t('start-date')" :value="startDate" />
      <VtsTabularKeyValueRow :label="t('end-date')" :value="endDate" />
      <VtsTabularKeyValueRow :label="t('duration')" :value="duration" />
      <VtsTabularKeyValueRow :label="t('status')">
        <template #value>
          <VtsStatus :status="backupLog.status" />
        </template>
      </VtsTabularKeyValueRow>
      <VtsTabularKeyValueRow :label="t('transfer-size')" :value="transferSize" />
      <VtsTabularKeyValueRow :label="t('task')">
        <template v-if="task !== undefined" #value>
          <UiLink size="medium" :to="taskRoute" icon="fa:bars-progress">
            {{ task.properties.name ?? task.id }}
          </UiLink>
        </template>
      </VtsTabularKeyValueRow>
    </VtsTabularKeyValueList>
  </UiCard>
</template>

<script setup lang="ts">
import { useXoBackupLogsUtils } from '@/modules/backup-log/composables/use-xo-backup-log-utils.composable.ts'
import type { FrontXoBackupLog } from '@/modules/backup-log/remote-resources/use-xo-backup-log-collection.ts'
import { useXoTaskCollection } from '@/modules/task/remote-resources/use-xo-task-collection.ts'
import { getTaskRoute } from '@/modules/task/utils/xo-task.util.ts'
import VtsCodeSnippet from '@core/components/code-snippet/VtsCodeSnippet.vue'
import VtsStatus from '@core/components/status/VtsStatus.vue'
import VtsTabularKeyValueList from '@core/components/tabular-key-value-list/VtsTabularKeyValueList.vue'
import VtsTabularKeyValueRow from '@core/components/tabular-key-value-row/VtsTabularKeyValueRow.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { formatSize } from '@core/utils/size.util.ts'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { backupLog } = defineProps<{ backupLog: FrontXoBackupLog }>()

const { t } = useI18n()

const { getBackupLogDate, getBackupLogDuration, findTransferTaskSize } = useXoBackupLogsUtils()

const { tasks } = useXoTaskCollection()

const startDate = computed(() => getBackupLogDate(backupLog.start))

const endDate = computed(() => getBackupLogDate(backupLog.end))

const duration = computed(() => getBackupLogDuration(backupLog.start, backupLog.end))

const transferSize = computed(() => {
  const size = findTransferTaskSize(backupLog.tasks)

  return size !== undefined ? formatSize(size, 2) : undefined
})

const task = computed(() => tasks.value.find(task => task.properties.runJobId === backupLog.id))

const taskRoute = computed(() => (task.value !== undefined ? getTaskRoute(task.value.id) : undefined))
</script>
