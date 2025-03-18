<template>
  <ComponentStory
    v-slot="{ properties }"
    :params="[prop('task').required(), prop('user').str().preset('Username').widget()]"
  >
    <UiTaskItem v-bind="properties" :task />
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import { prop } from '@/libs/story/story-param.ts'
import UiTaskItem from '@core/components/ui/task-item/UiTaskItem.vue'

const task = {
  id: '0m96rljcx',
  status: 'pending',
  name: 'Task name',
  tag: 'xo:task:action',
  start: 1744011802689,
  end: 1745395694000,
  infos: [
    {
      message: 'Started',
    },
    {
      message: 'info bar',
    },
  ],
  errors: [
    {
      message: 'error foo',
    },
    {
      message: 'error bar',
    },
  ],
  warnings: [
    {
      message: 'info bar',
    },
  ],
  progress: 25,
}
</script>
