<template>
  <ComponentStory
    v-slot="{ properties }"
    :params="[
      prop('label').str().preset('IP Address').widget(),
      prop('value').str().preset('192.168.1.10').widget(),
      slot('label').help('Overrides the label prop'),
      slot('value').help('Overrides the value prop, meant to receive text or inline elements'),
    ]"
  >
    <VtsKeyValueList>
      <VtsKeyValueRow v-bind="properties" />
    </VtsKeyValueList>
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import { prop, slot } from '@/libs/story/story-param'
import VtsKeyValueList from '@core/components/key-value-list/VtsKeyValueList.vue'
import VtsKeyValueRow from '@core/components/key-value-row/VtsKeyValueRow.vue'
</script>
