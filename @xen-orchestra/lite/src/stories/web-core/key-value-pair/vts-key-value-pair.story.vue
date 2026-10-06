<template>
  <ComponentStory
    v-slot="{ properties }"
    :params="[
      prop('label').str().preset('CPU').widget(),
      prop('value').str().preset('4 vCPUs').widget(),
      prop('copy').bool().help('Displays a copy button that copies the value prop').widget(),
      prop('copy-value')
        .str()
        .help('Displays a copy button that copies this string instead of the value prop')
        .widget(),
      slot('label').help('Overrides the label prop'),
      slot('value').help('Overrides the value prop, meant to receive text or inline elements'),
    ]"
  >
    <dl class="pair-wrapper">
      <VtsKeyValuePair v-bind="properties" />
    </dl>
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import { prop, slot } from '@/libs/story/story-param.ts'
import VtsKeyValuePair from '@core/components/key-value-pair/VtsKeyValuePair.vue'
</script>

<style lang="postcss" scoped>
.pair-wrapper {
  display: flex;
  gap: 2.4rem;
}
</style>
