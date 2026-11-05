<template>
  <ComponentStory
    v-slot="{ properties }"
    :params="[prop('tasks').type('Task[]').required().preset(allTasks), event('select')]"
  >
    <UiTaskList v-bind="properties" />
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import { event, prop } from '@/libs/story/story-param.ts'
import { allTasks } from '@/stories/web-core/ui/task-item/mock-tasks.ts'
import UiTaskList from '@core/components/ui/task-list/UiTaskList.vue'
</script>
