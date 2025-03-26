<template>
  <VtsTreeItem :expanded="branch.isExpanded">
    <UiTreeItemLabel :route="`/task/${branch.data.id}`" @toggle="branch.toggleExpand()">
      <!--      {{ branch.data.properties.name }} -->
      <UiTaskItem :task="branch.data" :user="user" />
    </UiTreeItemLabel>
    <template v-if="branch.hasChildren" #sublist>
      <VtsTreeList>
        <TaskTreeItem v-for="child in branch.rawChildren" :key="child.id" :branch="child" />
      </VtsTreeList>
    </template>
  </VtsTreeItem>
</template>

<script lang="ts" setup>
import { useUserStore } from '@/stores/xo-rest-api/user.store.ts'
import type { TaskBranch } from '@/types/tree.type.ts'
import VtsTreeItem from '@core/components/tree/VtsTreeItem.vue'
import VtsTreeList from '@core/components/tree/VtsTreeList.vue'
import UiTaskItem from '@core/components/ui/task-item/UiTaskItem.vue'
import UiTreeItemLabel from '@core/components/ui/tree-item-label/UiTreeItemLabel.vue'
import { computed, defineProps } from 'vue'

const { branch } = defineProps<{
  branch: TaskBranch
}>()

// console.log('Branch', branch)

const { records } = useUserStore().subscribe()

const user = computed(() => {
  const userId = branch.data.properties.userId
  if (!userId) return
  const user = records.value.find(user => user.id === userId)
  return user ? user?.name || user.email : 'Not Found'
})
</script>
