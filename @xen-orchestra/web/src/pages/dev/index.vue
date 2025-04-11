<template>
  <VtsTreeList v-if="!isReady">
    <VtsTreeLoadingItem v-for="i in 5" :key="i" :icon="faTasks" />
  </VtsTreeList>
  <NoResults v-else-if="tasks.length === 0" />
  <VtsTreeList v-else>
    <TaskTreeItem v-for="task in tasks" :key="task.id" :branch="task" />
  </VtsTreeList>
</template>

<script setup lang="ts">
import NoResults from '@/components/NoResults.vue'
import TaskTreeItem from '@/components/tree/TaskTreeItem.vue'
import { useTaskTree } from '@/composables/task-tree.composable.ts'
import VtsTreeList from '@core/components/tree/VtsTreeList.vue'
import VtsTreeLoadingItem from '@core/components/tree/VtsTreeLoadingItem.vue'
import { faTasks } from '@fortawesome/free-solid-svg-icons'

const { tasks, isReady } = useTaskTree()
</script>
