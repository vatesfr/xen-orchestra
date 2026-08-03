<template>
  <ComponentStory
    v-slot="{ properties }"
    :params="[prop('tasks').type('Task[]').required().preset(mockTasks), event('select')]"
  >
    <VtsTaskList v-bind="properties" />
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import { event, prop } from '@/libs/story/story-param.ts'
import VtsTaskList from '@core/components/task/VtsTaskList.vue'
import { mockTasks } from '@core/fixtures/mock-tasks.fixture.ts'
</script>
