<template>
  <ComponentStory
    v-slot="{ properties }"
    :presets
    :params="[
      prop('task').type('object').required().widget().preset(pendingBackupTask),
      prop('showEyeIcon').type('boolean').widget(boolean()).preset(true),
      event('select').args({ id: 'string' }),
    ]"
  >
    <UiTaskItem v-bind="properties" />
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import { event, prop } from '@/libs/story/story-param.ts'
import { boolean } from '@/libs/story/story-widget.ts'
import {
  completedWithRootLinkTask,
  deepNestedTask,
  failedWithWarningsTask,
  migrationNamePartsTask,
  pendingBackupTask,
} from '@/stories/web-core/ui/task-item/mock-tasks.ts'
import UiTaskItem from '@core/components/ui/task-item/UiTaskItem.vue'

const presets: Record<
  string,
  {
    props?: Record<string, unknown>
  }
> = {
  'Pending backup': {
    props: {
      task: pendingBackupTask,
      showEyeIcon: true,
    },
  },
  'Completed + root link': {
    props: {
      task: completedWithRootLinkTask,
      showEyeIcon: true,
    },
  },
  'Failed + warnings': {
    props: {
      task: failedWithWarningsTask,
      showEyeIcon: true,
    },
  },
  'Migration (nameParts)': {
    props: {
      task: migrationNamePartsTask,
      showEyeIcon: true,
    },
  },
  'Deep nested': {
    props: {
      task: deepNestedTask,
      showEyeIcon: true,
    },
  },
}
</script>
