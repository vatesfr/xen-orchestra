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
import UiTaskItem from '@core/components/ui/task-item/UiTaskItem.vue'
import { mockTasks } from '@core/fixtures/mock-tasks.fixture.ts'

const task = mockTasks[1]!
</script>
