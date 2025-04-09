<template>
  <VtsTreeList v-if="!isReady">
    <VtsTreeLoadingItem v-for="i in 5" :key="i" :icon="faTasks" />
  </VtsTreeList>
  <NoResults v-else-if="tasks.length === 0" />
  <div v-else>
    <TaskTreeItem v-for="task in tasks" :key="task.id" :branch="task" />
  </div>
</template>

<script setup lang="ts">
import NoResults from '@/components/NoResults.vue'
import TaskTreeItem from '@/components/tree/TaskTreeItem.vue'
import { useTaskTree } from '@/composables/task-tree.composable.ts'
import VtsTreeList from '@core/components/tree/VtsTreeList.vue'
import VtsTreeLoadingItem from '@core/components/tree/VtsTreeLoadingItem.vue'
import { IK_TREE_LIST_DEPTH } from '@core/utils/injection-keys.util.ts'
import { faTasks } from '@fortawesome/free-solid-svg-icons'
import { inject, provide } from 'vue'

const { tasks, isReady } = useTaskTree()

const depth = inject(IK_TREE_LIST_DEPTH, 0)
provide(IK_TREE_LIST_DEPTH, depth + 1)
</script>
