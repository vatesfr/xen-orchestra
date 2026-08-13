<template>
  <ComponentStory
    v-slot="{ properties }"
    :presets
    :params="[
      prop('task').type('object').required().widget().preset(pendingBackupTask),
      prop('depth').type('number').required().preset(1),
      model('expanded').prop(p => p.type('boolean').widget(boolean()).preset(false)),
      prop('selected').type('boolean').widget(boolean()).preset(false),
      prop('showEyeIcon').type('boolean').widget(boolean()).preset(true),
      event('expand'),
      event('select').args({ id: 'string' }),
    ]"
  >
    <ul>
      <UiTaskItem v-bind="properties" @expand="properties['onUpdate:expanded']?.(!properties.expanded)" />
    </ul>
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import { event, model, prop } from '@/libs/story/story-param.ts'
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
      depth: 1,
      expanded: false,
      selected: false,
      showEyeIcon: true,
    },
  },
  'Completed + root link': {
    props: {
      task: completedWithRootLinkTask,
      depth: 1,
      expanded: false,
      selected: false,
      showEyeIcon: true,
    },
  },
  'Failed + warnings': {
    props: {
      task: failedWithWarningsTask,
      depth: 1,
      expanded: false,
      selected: false,
      showEyeIcon: true,
    },
  },
  'Migration (nameParts)': {
    props: {
      task: migrationNamePartsTask,
      depth: 1,
      expanded: false,
      selected: false,
      showEyeIcon: true,
    },
  },
  'Deep nested': {
    props: {
      task: deepNestedTask,
      depth: 1,
      expanded: true,
      selected: false,
      showEyeIcon: true,
    },
  },
}
</script>
