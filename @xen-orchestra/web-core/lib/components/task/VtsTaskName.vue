<template>
  <span v-if="task.nameParts || task.name" class="vts-task-name">
    <UiLink v-if="task.to" :size display-inline :to="task.to">{{ fullName }}</UiLink>
    <template v-else-if="task.nameParts">
      <UiLink v-for="(part, index) in task.nameParts" :key="index" :size display-inline :to="part.to">{{
        part.text
      }}</UiLink>
    </template>
    <UiLink v-else :size display-inline>{{ task.name }}</UiLink>
  </span>
</template>

<script lang="ts" setup>
import UiLink from '@core/components/ui/link/UiLink.vue'
import type { Task } from '@core/components/ui/task-item/UiTaskItem.vue'
import { computed } from 'vue'

const { task, size } = defineProps<{
  task: Pick<Task, 'name' | 'nameParts' | 'to'>
  size: 'small' | 'medium'
}>()

const fullName = computed(() => task.nameParts?.map(part => part.text).join('') ?? task.name)
</script>

<style lang="postcss" scoped>
.vts-task-name {
  line-height: 1;
}
</style>
