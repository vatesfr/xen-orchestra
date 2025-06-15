<template>
  <ComponentStory :params :presets>
    <UiTablePagination v-bind="bindings" />
  </ComponentStory>
</template>

<script lang="ts" setup>
import UiTablePagination from '@core/components/ui/table-pagination/UiTablePagination.vue'
import ComponentStory from '@core/packages/story/ComponentStory.vue'
import { useStory } from '@core/packages/story/use-story.ts'
import { ref } from 'vue'

const { params, bindings } = useStory({
  props: {
    from: {
      preset: ref(1),
      required: true,
    },
    to: {
      preset: ref(50),
      required: true,
    },
    total: {
      preset: ref(137),
      required: true,
    },
    isFirstPage: {
      preset: ref<boolean>(true),
      type: 'boolean',
      required: true,
    },
    isLastPage: {
      preset: ref<boolean>(false),
      type: 'boolean',
      required: true,
    },
  },
  models: {
    showBy: {
      preset: ref<number>(),
      default: 50,
      required: true,
    },
  },
  events: {
    first: {},
    previous: {},
    next: {},
    last: {},
  },
})

const presets = {
  'First page': () => {
    bindings.from = 1
    bindings.to = 50
    bindings.total = 137
    bindings.isFirstPage = true
    bindings.isLastPage = false
    bindings.showBy = 50
  },
  'Intermediate page': () => {
    bindings.from = 51
    bindings.to = 100
    bindings.total = 137
    bindings.isFirstPage = false
    bindings.isLastPage = false
  },
  'Last page': () => {
    bindings.from = 101
    bindings.to = 137
    bindings.total = 137
    bindings.isFirstPage = false
    bindings.isLastPage = true
  },
}
</script>
