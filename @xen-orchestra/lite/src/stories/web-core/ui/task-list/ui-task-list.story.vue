<template>
  <ComponentStory
    v-slot="{ properties }"
    :params="[
      prop('tasks')
        .type('Task[]')
        .required()
        .preset([task])
        .help('is an object contain all tasks. warning all id must be diferent in all subtask'),
      prop('depth').type('Number').preset('0').help('internal property for recursion'),
      prop('deepest').type('Boolean').preset(false).help('internal property for recursion'),
    ]"
  >
    <UiTaskList v-bind="properties" />
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import { prop } from '@/libs/story/story-param'
import type { Task } from '@core/components/ui/task-item/UiTaskItem.vue'
import UiTaskList from '@core/components/ui/task-list/UiTaskList.vue'
let task: Task

// fake data for brain ts
task = {
  errored: true,
  status: 'success',
  id: '1' + Date.now(),
  start: Date.now() - 31_536_000_000,
  end: Date.now(),
  tag: 'xo:xostore:destroy',
  label: 'task',
  progress: 42,
}

// recustion dont works
task = {
  errored: true,
  status: 'success',
  id: '1' + Date.now(),
  start: Date.now() - 31_536_000_000,
  end: Date.now(),
  tag: 'xo:xostore:destroy',
  label: 'task',
  progress: 42,
  // is an function for make an unique id based on time of generation
  tasks: (() => {
    return [
      {
        errored: true,
        status: 'success',
        id: '1' + Date.now(),
        start: Date.now() - 31_536_000_000,
        end: Date.now(),
        tag: 'xo:xostore:destroy',
        label: 'task',
        progress: 42,
      },
      {
        errored: true,
        status: 'success',
        id: '1' + Date.now(),
        start: Date.now() - 31_536_000_000,
        end: Date.now(),
        tag: 'xo:xostore:destroy',
        label: 'task',
        progress: 42,
        tasks: [
          {
            errored: true,
            status: 'success',
            id: '1' + Date.now(),
            start: Date.now() - 31_536_000_000,
            end: Date.now(),
            tag: 'xo:xostore:destroy',
            label: 'task',
            progress: 42,
          },
          task,
        ],
      },
    ]
  })(),
}
</script>
