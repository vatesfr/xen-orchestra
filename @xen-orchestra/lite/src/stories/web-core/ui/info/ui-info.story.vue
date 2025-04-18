<template>
  <ComponentStory
    v-slot="{ properties, settings }"
    :params="[
      prop('accent').enum('info', 'success', 'warning', 'danger', 'muted').required().preset('info').widget(),
      prop('wrap').bool().help('Choose if the text should wrap if too long').widget(),
      slot(),
      setting('defaultSlot').widget(text()).preset('message'),
    ]"
  >
    <div class="wrapper">
      <UiInfo v-bind="properties">{{ settings.defaultSlot }}</UiInfo>
    </div>
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import { prop, setting, slot } from '@/libs/story/story-param'
import { text } from '@/libs/story/story-widget'
import UiInfo from '@core/components/ui/info/UiInfo.vue'
</script>

<style scoped lang="postcss">
.wrapper {
  max-width: 30rem;
}
</style>
