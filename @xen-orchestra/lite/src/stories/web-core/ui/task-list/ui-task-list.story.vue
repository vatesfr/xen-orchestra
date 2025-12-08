<template>
  <ComponentStory
    v-slot="{ properties }"
    :params="[prop('tasks').type('Task[]').required().preset(tasks), event('select')]"
  >
    <UiTaskList v-bind="properties" />
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import { event, prop } from '@/libs/story/story-param.ts'
import type { Task } from '@core/components/ui/task-item/UiTaskItem.vue'
import UiTaskList from '@core/components/ui/task-list/UiTaskList.vue'

const tasks: Task[] = [
  {
    id: '1',
    name: 'VM backup',
    status: 'pending',
    progress: 25,
    tasks: [
      {
        id: '1-1',
        name: 'Snapshot',
        status: 'success',
        progress: 100,
      },
      {
        id: '1-2',
        name: 'Export',
        status: 'pending',
        progress: 10,
        tasks: [
          {
            id: '1-2-1',
            name: 'Sub task',
            status: 'pending',
            progress: 5,
          },
        ],
      },
    ],
  },
  {
    id: '2',
    name: 'VM Migration',
    status: 'failure',
    progress: 100,
    warning: [
      {
        data: { file: 'server-1.log' },
        message: 'warning',
      },
    ],
  },
  {
    id: '3',
    name: 'Storage Migration',
    status: 'interrupted',
    progress: 100,
    infos: [
      { data: { rows: 1200 }, message: 'info' },
      { data: null, message: 'info' },
    ],
  },
  {
    id: '4',
    name: 'Final task',
    end: Date.now() - 1000 * 60 * 15,
    status: 'success',
    progress: 75,
    warning: [
      {
        data: { file: 'server-1.log' },
        message: 'warning',
      },
    ],
  },
]
</script>
