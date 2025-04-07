<template>
  <ComponentStory
    :params="[
      slot().help('Meant to receive a <UiTreeItemLabel>'),
      slot('sublist').help('Meant to receive a <VtsTreeList> child.'),
    ]"
  >
    <UiTaskItem :task user="user" />
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import { slot } from '@/libs/story/story-param'
import UiTaskItem from '@core/components/ui/task-item/UiTaskItem.vue'

const task = {
  id: '0m96rljcx',
  status: 'pending',
  name: 'Task name',
  tag: 'xo:task:action',
  start: 1744011802689,
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
      message: 'info bar',
    },
  ],
  warnings: [
    {
      message: 'info bar',
    },
  ],
  progress: 25,
  // subtasks: [
  //   {
  //     id: '2d01nynf19i',
  //     status: 'pending',
  //     start: 1744011806694,
  //     infos: [
  //       {
  //         message: 'sub info',
  //       },
  //     ],
  //     progress: 50,
  //   },
  // ],
}
</script>
