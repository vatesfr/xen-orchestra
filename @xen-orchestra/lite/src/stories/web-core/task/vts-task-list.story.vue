<template>
  <ComponentStory
    v-slot="{ properties }"
    :params="[
      prop('tasks').type('Task[]').required().preset(allTasks),
      prop('selectedTaskId').str().widget(),
      prop('showEyeIcon').bool().widget(),
      prop('autoCollapseCompleted').bool().widget(),
      prop('expandAll')
        .bool()
        .widget()
        .help('Shows every task expanded; turning it off restores the tasks expanded before'),
      prop('unreadTaskIds').type('ReadonlySet<string>').help('Shows an unread dot column, with a dot for these tasks'),
      event('select').args({ id: 'string' }),
    ]"
    :presets="{
      'Unread tasks': {
        props: {
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
