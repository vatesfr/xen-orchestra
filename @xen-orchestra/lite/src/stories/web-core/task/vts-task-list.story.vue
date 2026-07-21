<template>
  <ComponentStory
    v-slot="{ properties }"
    :params="[prop('tasks').type('Task[]').required().preset(allTasks), event('select')]"
  >
    <VtsTaskList v-bind="properties" />
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import { event, prop } from '@/libs/story/story-param.ts'
import { allTasks } from '@/stories/web-core/ui/task-item/mock-tasks.ts'
import VtsTaskList from '@core/components/task/VtsTaskList.vue'
</script>
