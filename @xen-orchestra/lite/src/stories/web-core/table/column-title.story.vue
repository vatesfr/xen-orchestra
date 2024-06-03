<template>
  <ComponentStory
    v-slot="{ properties, settings }"
    :params="[
      iconProp(),
      prop('id').str().widget(),
      prop('interactive').bool().default(true).widget(),
      prop('disabled').bool().default(false).widget(),
      setting('slot').preset('vm').widget(),
      slot(),
    ]"
  >
    <UiTable vertical-border name="story">
      <thead>
        <tr>
          <ColumnTitle v-bind="properties" id="vm">{{ settings.slot }}</ColumnTitle>
        </tr>
      </thead>
    </UiTable>
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import { iconProp, prop, setting, slot } from '@/libs/story/story-param'
import ColumnTitle from '@core/components/table/ColumnTitle.vue'
import UiTable from '@core/components/table/UiTable.vue'
</script>
