<template>
  <ComponentStory :params>
    <UiHeadBar v-bind="bindings">
      {{ settings.defaultSlot }}
      <template v-if="settings.showStatusSlotDemoContent" #status>
        <UiLoader class="loader" />
        migrating... (34%)
      </template>
      <template v-if="settings.showDemoButtons" #actions>
        <UiButton :left-icon="faPlus" accent="brand" size="medium" variant="primary">New VM</UiButton>
        <UiButton :left-icon="faPowerOff" accent="brand" size="medium" variant="secondary">Change state</UiButton>
      </template>
    </UiHeadBar>
  </ComponentStory>
</template>

<script lang="ts" setup>
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiHeadBar from '@core/components/ui/head-bar/UiHeadBar.vue'
import UiLoader from '@core/components/ui/loader/UiLoader.vue'
import ComponentStory from '@core/packages/story/ComponentStory.vue'
import { iconChoice } from '@core/packages/story/story-param.ts'
import { boolean } from '@core/packages/story/story-widget.ts'
import { useStory } from '@core/packages/story/use-story.ts'
import type { IconDefinition } from '@fortawesome/fontawesome-common-types'
import { faPlus, faPowerOff } from '@fortawesome/free-solid-svg-icons'
import { ref } from 'vue'

const { params, bindings, settings } = useStory({
  props: {
    icon: {
      preset: ref<IconDefinition>(),
      type: 'IconDefinition',
      widget: iconChoice(),
    },
  },
  slots: {
    defaultSlot: {
      help: 'Meant to display the label of the object',
    },
    icon: {
      help: 'Meant to receive an ObjectIcon or UiIcon component',
    },
    status: {
      help: 'Meant to display the status of the object, e.g., migration progress for a VM',
    },
    actions: {
      help: 'Meant to receive UiButton or ButtonIcon components that will trigger actions',
    },
  },
  settings: {
    defaultSlot: {
      preset: 'Pool name',
    },
    showDemoButtons: {
      preset: false,
      widget: boolean(),
    },
    showStatusSlotDemoContent: {
      preset: false,
      widget: boolean(),
    },
  },
})
</script>

<style lang="postcss" scoped>
.loader {
  font-size: 2rem;
  color: var(--color-brand-txt-base);
}
</style>
