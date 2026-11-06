<template>
  <VtsContentSidePanel class="run">
    <UiCard class="container">
      <BackupLogRunTasksList :backup-log />
    </UiCard>
    <BackupLogTaskSidePanel :task="selectedTask" @close="selectedTask = undefined" />
  </VtsContentSidePanel>
</template>

<script setup lang="ts">
import BackupLogRunTasksList from '@/modules/backup-log/components/run/BackupLogRunTasksList.vue'
import BackupLogTaskSidePanel from '@/modules/backup-log/components/run/panel/BackupLogTaskSidePanel.vue'
import type { BackupLogTask } from '@/modules/backup-log/composables/use-xo-backup-log-utils.composable.ts'
import type { FrontXoBackupLog } from '@/modules/backup-log/remote-resources/use-xo-backup-log-collection.ts'
import type { FrontXoTask } from '@/modules/task/remote-resources/use-xo-task-collection.ts'
import { findTaskById } from '@/modules/task/utils/xo-task.util.ts'
import VtsContentSidePanel from '@core/components/layout/VtsContentSidePanel.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import { useRouteQuery } from '@core/composables/route-query.composable.ts'

const { backupLog } = defineProps<{ backupLog: FrontXoBackupLog }>()

const selectedTask = useRouteQuery<BackupLogTask | undefined>('id', {
  toData: id => findTaskById(backupLog.tasks ?? [], id as FrontXoTask['id']) as BackupLogTask | undefined,
  toQuery: task => task?.id ?? '',
})
</script>

<style scoped lang="postcss">
.run {
  .container {
    height: fit-content;
    gap: 4rem;
    margin: 0.8rem;
  }
}
</style>
