<template>
  <ComponentStory
    v-slot="{ properties }"
    :params="[
      prop('tasks').type('Task[]').required().preset(allTasks),
      prop('selectedTaskId').str().widget(),
      prop('showEyeIcon').bool().default(true).widget(),
      prop('autoCollapseCompleted').bool().widget(),
      prop('expandAll').bool().widget(),
      prop('unreadTaskIds').type('ReadonlySet<string>').help('Shows an unread dot column, with a dot for these tasks'),
      event('select').args({ id: 'string' }),
    ]"
    :presets="{
      'Unread tasks': {
        props: {
          showEyeIcon: false,
          unreadTaskIds: new Set(['1', '1-2', '4', '9', '9-2', '9-2-1']),
        },
      },
    }"
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
