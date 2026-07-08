<template>
  <VtsSidePanel :has-selection="!!task" @close="emit('close')">
    <template v-if="task">
      <TaskQuickInfosCard :task />
      <TaskInfosCard v-if="task.infos" :task />
      <TaskWarningsCard v-if="task.warnings" :task />
      <TaskErrorsCard v-if="isError" :task />
      <TaskObjectsCard v-if="task.properties.objectId" :task />
      <TaskPropertiesCard v-if="properties.other && Object.keys(properties.other).length > 0" :task />
    </template>
  </VtsSidePanel>
</template>

<script setup lang="ts">
import TaskErrorsCard from '@/modules/task/components/list/panel/cards/TaskErrorsCard.vue'
import TaskInfosCard from '@/modules/task/components/list/panel/cards/TaskInfosCard.vue'
import TaskObjectsCard from '@/modules/task/components/list/panel/cards/TaskObjectsCard.vue'
import TaskPropertiesCard from '@/modules/task/components/list/panel/cards/TaskPropertiesCard.vue'
import TaskQuickInfosCard from '@/modules/task/components/list/panel/cards/TaskQuickInfosCard.vue'
import TaskWarningsCard from '@/modules/task/components/list/panel/cards/TaskWarningsCard.vue'
import { useXoTaskPropertiesUtils } from '@/modules/task/composables/xo-task-properties-utils.composable.ts'
import type { FrontXoTask } from '@/modules/task/remote-resources/use-xo-task-collection.ts'
import VtsSidePanel from '@core/components/panel/VtsSidePanel.vue'
import { computed } from 'vue'

const { task } = defineProps<{
  task?: FrontXoTask
}>()

const emit = defineEmits<{
  close: []
}>()

const { properties } = useXoTaskPropertiesUtils(() => task)

const isError = computed(() => task && task.result && (task.status === 'failure' || task.status === 'interrupted'))
</script>
