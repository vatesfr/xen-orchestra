<template>
  <ComponentStory
    v-slot="{ properties }"
    :params="[
      prop('separator')
        .required()
        .enum('bullet', 'chevron')
        .preset('bullet')
        .widget()
        .help('Bullets join facts, chevrons a location from the widest place to the narrowest'),
      slot().help('The parts, separated by the separator; a part hidden by v-if leaves no stray separator'),
    ]"
  >
    <VtsInlineParts v-bind="properties">
      <span>vcenter.lab</span>
      <span>DC-Paris</span>
      <span>esx01</span>
    </VtsInlineParts>
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import { prop, slot } from '@/libs/story/story-param.ts'
import VtsInlineParts from '@core/components/inline-parts/VtsInlineParts.vue'
</script>
