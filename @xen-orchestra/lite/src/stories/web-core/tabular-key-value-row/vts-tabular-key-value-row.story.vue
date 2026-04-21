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
    <VtsTabularKeyValueList>
      <VtsTabularKeyValueRow v-bind="properties" />
    </VtsTabularKeyValueList>
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import { prop, slot } from '@/libs/story/story-param'
import VtsTabularKeyValueList from '@core/components/tabular-key-value-list/VtsTabularKeyValueList.vue'
import VtsTabularKeyValueRow from '@core/components/tabular-key-value-row/VtsTabularKeyValueRow.vue'
</script>
