<template>
  <ComponentStory :params>
    <TabList>
      <TabItem v-bind="bindings">
        {{ settings.label }}
        <UiCounter v-if="settings.counter" :value="settings.counter" accent="info" variant="primary" size="small" />
      </TabItem>
    </TabList>
  </ComponentStory>
</template>

<script lang="ts" setup>
import TabItem from '@core/components/tab/TabItem.vue'
import TabList from '@core/components/tab/TabList.vue'
import UiCounter from '@core/components/ui/counter/UiCounter.vue'
import ComponentStory from '@core/packages/story/ComponentStory.vue'
import { useStory } from '@core/packages/story/use-story.ts'
import { ref } from 'vue'

const { params, bindings, settings } = useStory({
  props: {
    disabled: {
      preset: ref<boolean>(),
      type: 'boolean',
    },
    active: {
      preset: ref<boolean>(),
      type: 'boolean',
    },
    tag: {
      preset: 'span',
      help: 'HTML tag to use for the component',
      widget: false,
    },
  },
  slots: {
    default: {},
  },
  settings: {
    label: { preset: 'Foobar' },
    counter: { preset: ref<any>() },
  },
})
</script>
