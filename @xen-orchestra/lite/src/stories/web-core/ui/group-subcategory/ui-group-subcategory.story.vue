<template>
  <ComponentStory
    v-slot="{ settings }"
    :params="[
      slot().help('Meant to receive the subcategory title'),
      slot('info').help('Meant to receive a short text displayed on the right'),
      setting('defaultSlot').widget(text()).preset('Into a pool'),
      setting('info').widget(text()).preset('Writes to a pool'),
    ]"
  >
    <UiGroupSubcategory>
      {{ settings.defaultSlot }}
      <template v-if="settings.info" #info>{{ settings.info }}</template>
    </UiGroupSubcategory>
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import { setting, slot } from '@/libs/story/story-param.ts'
import { text } from '@/libs/story/story-widget.ts'
import UiGroupSubcategory from '@core/components/ui/group-subcategory/UiGroupSubcategory.vue'
</script>
