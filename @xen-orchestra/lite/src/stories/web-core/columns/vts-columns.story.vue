<template>
  <ComponentStory
    v-slot="{ properties }"
    :params="[
      prop('columns').num().default(2).widget(),
      slot().help('Meant to receive VtsColumn component or any element'),
    ]"
    :presets
  >
    <VtsColumns v-bind="properties">
      <VtsColumn class="column">
        <div>1st column</div>
        <div>foo</div>
        <div>bar</div>
      </VtsColumn>
      <VtsColumn class="column">
        <div>2nd column</div>
        <div>baz</div>
      </VtsColumn>
    </VtsColumns>
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import { prop, slot } from '@/libs/story/story-param'
import VtsColumn from '@core/components/column/VtsColumn.vue'
import VtsColumns from '@core/components/columns/VtsColumns.vue'

const presets = {
  '3 columns layout with only 2 columns filled': {
    props: {
      columns: 3,
    },
  },
}
</script>

<style lang="postcss" scoped>
.column {
  background-color: var(--color-neutral-background-secondary);
  padding: 1rem;
  border-radius: 0.4rem;
}
</style>
