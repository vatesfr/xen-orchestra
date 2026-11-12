<template>
  <VtsSidePanel :has-selection="!!task" @close="emit('close')">
    <template v-if="task">
      <BackupLogTaskQuickInfosCard :task />
      <TaskInfosCard v-if="task.infos" :task />
      <TaskWarningsCard v-if="task.warnings" :task />
      <BackupLogTaskJsonCard :task />
      <TaskErrorsCard v-if="isError" :task />
    </template>
  </VtsSidePanel>
</template>

<script setup lang="ts">
import BackupLogTaskJsonCard from '@/modules/backup-log/components/run/panel/cards/BackupLogTaskJsonCard.vue'
import BackupLogTaskQuickInfosCard from '@/modules/backup-log/components/run/panel/cards/BackupLogTaskQuickInfosCard.vue'
import type { BackupLogTask } from '@/modules/backup-log/composables/use-xo-backup-log-utils.composable.ts'
import TaskErrorsCard from '@/modules/task/components/list/panel/cards/TaskErrorsCard.vue'
import TaskInfosCard from '@/modules/task/components/list/panel/cards/TaskInfosCard.vue'
import TaskWarningsCard from '@/modules/task/components/list/panel/cards/TaskWarningsCard.vue'
import VtsSidePanel from '@core/components/panel/VtsSidePanel.vue'
import { computed } from 'vue'

const { task } = defineProps<{
  task?: BackupLogTask
}>()

const emit = defineEmits<{
  close: []
}>()

const isError = computed(() => task && task.result && (task.status === 'failure' || task.status === 'interrupted'))
</script>
