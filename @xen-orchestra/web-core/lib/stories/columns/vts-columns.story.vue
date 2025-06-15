<template>
  <ComponentStory :params :presets>
    <VtsColumns v-bind="bindings">
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
import VtsColumn from '@core/components/column/VtsColumn.vue'
import VtsColumns from '@core/components/columns/VtsColumns.vue'
import ComponentStory from '@core/packages/story/ComponentStory.vue'
import { useStory } from '@core/packages/story/use-story.ts'
import { ref } from 'vue'

const { params, bindings } = useStory({
  props: {
    columns: {
      preset: ref<number>(),
      type: 'number',
      default: 2,
    },
  },
  slots: {
    default: { help: 'Meant to receive VtsColumn component or any element' },
  },
})

const presets = {
  '3 columns layout with only 2 columns filled': () => {
    bindings.columns = 3
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
