<template>
  <ComponentStory
    v-slot="{ properties }"
    :params="[prop('total-items').required().preset(100).num(), prop('disabled').bool().widget()]"
  >
    <UiTablePagination v-bind="properties" />
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import { prop } from '@/libs/story/story-param'
import UiTablePagination from '@core/components/ui/table-pagination/UiTablePagination.vue'
</script>
