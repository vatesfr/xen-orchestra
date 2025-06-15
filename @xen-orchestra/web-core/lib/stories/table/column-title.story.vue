<template>
  <ComponentStory :params>
    <VtsTable vertical-border name="story">
      <thead>
        <tr>
          <ColumnTitle v-bind="bindings" id="vm">{{ settings.slotContent }}</ColumnTitle>
        </tr>
      </thead>
    </VtsTable>
  </ComponentStory>
</template>

<script lang="ts" setup>
import ColumnTitle from '@core/components/table/ColumnTitle.vue'
import VtsTable from '@core/components/table/VtsTable.vue'
import ComponentStory from '@core/packages/story/ComponentStory.vue'
import { iconChoice } from '@core/packages/story/story-param.ts'
import { useStory } from '@core/packages/story/use-story.ts'
import type { IconDefinition } from '@fortawesome/fontawesome-common-types'
import { ref } from 'vue'

const { params, bindings, settings } = useStory({
  props: {
    id: {
      preset: ref<string>(),
      type: 'string',
    },
    icon: {
      preset: ref<IconDefinition>(),
      type: 'icon',
      widget: iconChoice(),
    },
    interactive: {
      preset: ref<boolean>(),
      default: true,
    },
    disabled: {
      preset: ref<boolean>(),
      type: 'boolean',
    },
  },
  slots: {
    default: {
      help: 'Default slot content',
    },
  },
  settings: {
    slotContent: {
      preset: 'some content',
    },
  },
})
</script>
