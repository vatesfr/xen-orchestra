<template>
  <ComponentStory
    v-slot="{ properties }"
    :params="[
      prop('task').type('object').required().widget().preset(task),
      prop('expanded').type('boolean').widget(boolean()).preset(false),
      prop('depth').type('number').required().preset(1),
    ]"
  >
    <ul>
      <UiTaskItem v-bind="properties" />
    </ul>
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import { prop } from '@/libs/story/story-param.ts'
import { boolean } from '@/libs/story/story-widget.ts'
import UiTaskItem, { type Task } from '@core/components/ui/task-item/UiTaskItem.vue'

const task: Task = {
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
      end: Date.now() - 1000 * 60 * 3,
      status: 'success',
      userName: 'Admin',
      type: 'snapshot',
      progress: 100,
    },
  ],
}
</script>
