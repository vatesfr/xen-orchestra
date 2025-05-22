<template>
  <ComponentStory v-slot="{ properties }" :params="[iconProp(), prop('task').type('Task').required().preset(task)]">
    <UiTaskItem v-bind="properties" />
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import { iconProp, prop } from '@/libs/story/story-param'
import UiTaskItem from '@core/components/ui/task-item/UiTaskItem.vue'

const task = {
  errored: true,
  status: 'success',
  id: '1' + Date.now(),
  start: Date.now() - 31_536_000_000,
  end: Date.now(),
  tag: 'xo:xostore:destroy',
  label: 'task',
  progress: 42,
}
</script>
