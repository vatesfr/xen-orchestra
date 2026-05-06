<template>
  <ComponentStory
    v-slot="{ properties }"
    :params="[
      prop('label').str().preset('CPU').widget(),
      prop('value').str().preset('4 vCPUs').widget(),
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
import { prop, slot } from '@/libs/story/story-param'
import VtsKeyValuePair from '@core/components/key-value-pair/VtsKeyValuePair.vue'
</script>

<style lang="postcss" scoped>
.pair-wrapper {
  display: flex;
  gap: 2.4rem;
}
</style>
