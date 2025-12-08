<template>
  <ComponentStory
    v-slot="{ properties }"
    :params="[
      prop('task').type('object').required().widget().preset(task),
      prop('expanded').type('boolean').widget(boolean()).preset(false),
      prop('depth').type('number').required().preset(1),
      event('select'),
    ]"
  >
    <ul>
      <UiTaskItem v-bind="properties" />
    </ul>
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import { event, prop } from '@/libs/story/story-param.ts'
import { boolean } from '@/libs/story/story-widget.ts'
import UiTaskItem, { type Task } from '@core/components/ui/task-item/UiTaskItem.vue'

const task: Task = {
  id: '1',
  name: 'VM backup',
  status: 'pending',
  progress: 25,
  tasks: [
    {
      id: '1-1',
      name: 'Snapshot',
      end: Date.now() - 1000 * 60 * 3,
      status: 'success',
      progress: 100,
    },
  ],
}
</script>
