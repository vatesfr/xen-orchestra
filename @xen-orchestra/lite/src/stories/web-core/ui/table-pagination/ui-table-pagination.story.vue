<template>
  <ComponentStory
    v-slot="{ properties }"
    :params="[
      prop('from').required().num().widget().preset(1),
      prop('to').required().num().widget().preset(50),
      prop('total').required().num().widget().preset(137),
      prop('isFirstPage').required().bool().widget().preset(true),
      prop('isLastPage').required().bool().widget(),
      model('showBy')
        .preset('50')
        .prop(p => p.num())
        .required(),
      event('first'),
      event('previous'),
      event('next'),
      event('last'),
    ]"
    :presets
  >
    <UiTablePagination v-bind="properties" />
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import { event, model, prop } from '@/libs/story/story-param'
import UiTablePagination from '@core/components/ui/table-pagination/UiTablePagination.vue'

const presets = {
  'First page': {
    props: {
      from: 1,
      to: 50,
      total: 137,
      isFirstPage: true,
      isLastPage: false,
      showBy: 50,
    },
  },
  'Intermediate page': {
    props: {
      from: 51,
      to: 100,
      total: 137,
      isFirstPage: false,
      isLastPage: false,
    },
  },
  'Last page': {
    props: {
      from: 101,
      to: 137,
      total: 137,
      isFirstPage: false,
      isLastPage: true,
    },
  },
}
</script>
