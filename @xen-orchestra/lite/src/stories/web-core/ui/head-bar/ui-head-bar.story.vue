<template>
  <ComponentStory
    v-slot="{ properties, settings }"
    :params="[
      iconProp('icon'),
      slot().help('Meant to display the label of the object'),
      slot('icon').help('Meant to receive an ObjectIcon or UiIcon component'),
      slot('status').help('Meant to display the status of the object, e.g., migration progress for a VM'),
      slot('actions').help('Meant to receive UiButton or ButtonIcon components that will trigger actions'),
      setting('default').preset('Pool name').widget(),
      setting('showDemoButtons').widget(boolean()),
      setting('showStatusSlotDemoContent').widget(boolean()),
    ]"
  >
    <UiHeadBar v-bind="properties">
      {{ settings.default }}
      <template v-if="settings.showStatusSlotDemoContent" #status>
        <UiLoader class="loader" />
        migrating... (34%)
      </template>
      <template v-if="settings.showDemoButtons" #actions>
        <UiButton size="medium" variant="primary" accent="brand" :left-icon="faPlus">New VM</UiButton>
        <UiButton size="medium" variant="secondary" accent="brand" :left-icon="faPowerOff">Change state</UiButton>
      </template>
    </UiHeadBar>
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import { iconProp, setting, slot } from '@/libs/story/story-param'
import { boolean } from '@/libs/story/story-widget'
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiHeadBar from '@core/components/ui/head-bar/UiHeadBar.vue'
import UiLoader from '@core/components/ui/loader/UiLoader.vue'
import { faPlus, faPowerOff } from '@fortawesome/free-solid-svg-icons'
</script>

<style lang="postcss" scoped>
.loader {
  font-size: 2rem;
  color: var(--color-info-txt-base);
}
</style>
