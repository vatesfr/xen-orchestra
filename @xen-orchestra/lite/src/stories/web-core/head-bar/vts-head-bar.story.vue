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
    <VtsHeadBar v-bind="properties">
      {{ settings.default }}
      <template v-if="settings.showStatusSlotDemoContent" #status>
        <UiSpinner class="spinner" />
        migrating... (34%)
      </template>
      <template v-if="settings.showDemoButtons" #actions>
        <UiButton size="medium" level="primary" color="normal" :left-icon="faPlus">New VM</UiButton>
        <UiButton size="medium" level="secondary" color="normal" :left-icon="faPowerOff">Change state</UiButton>
      </template>
    </VtsHeadBar>
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import { iconProp, setting, slot } from '@/libs/story/story-param'
import { boolean } from '@/libs/story/story-widget'
import UiButton from '@core/components/button/UiButton.vue'
import VtsHeadBar from '@core/components/head-bar/VtsHeadBar.vue'
import UiSpinner from '@core/components/UiSpinner.vue'
import { faPlus, faPowerOff } from '@fortawesome/free-solid-svg-icons'
</script>

<style lang="postcss" scoped>
.spinner {
  font-size: 2rem;
  color: var(--color-normal-txt-base);
}
</style>
