<template>
  <ComponentStory v-slot="{ settings }" :params="[setting('tasks').widget(object()).preset(tasks)]">
    <UiTaskList :tasks="settings.tasks" />
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import { setting } from '@/libs/story/story-param.ts'
import { object } from '@/libs/story/story-widget.ts'
import type { Task } from '@core/components/ui/task-item/UiTaskItem.vue'
import UiTaskList from '@core/components/ui/task-list/UiTaskList.vue'

const tasks: Task[] = [
  {
    id: '1',
    name: 'VM backup',
    start: Date.now() - 1000 * 60 * 5,
    status: 'pending',
    userName: 'Admin',
    type: 'backup',
    progress: 25,
    tasks: [
      {
        id: '1-1',
        name: 'Snapshot',
        start: Date.now() - 1000 * 60 * 4,
        status: 'success',
        userName: 'Admin',
        type: 'snapshot',
        progress: 100,
      },
      {
        id: '1-2',
        name: 'Export',
        start: Date.now() - 1000 * 60 * 3,
        status: 'pending',
        userName: 'Admin',
        type: 'export',
        progress: 10,
        tasks: [
          {
            id: '1-2-1',
            name: 'Sub task',
            start: Date.now() - 1000 * 60 * 2,
            status: 'pending',
            userName: 'Admin',
            type: 'sub-export',
            progress: 5,
          },
        ],
      },
    ],
  },
  {
    id: '2',
    name: 'VM Migration',
    start: Date.now() - 1000 * 60 * 10,
    status: 'failure',
    userName: 'Admin',
    type: 'migration',
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
    start: Date.now() - 1000 * 60 * 15,
    status: 'interrupted',
    userName: 'Admin',
    type: 'storage-migration',
    progress: 100,
    infos: [
      { data: { rows: 1200 }, message: 'info' },
      { data: null, message: 'info' },
    ],
  },
  {
    id: '4',
    name: 'Final task',
    start: Date.now() - 1000 * 60 * 2,
    end: Date.now() - 1000 * 60 * 15,
    status: 'success',
    userName: 'Admin',
    type: 'final',
    progress: 100,
  },
]
</script>
