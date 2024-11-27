<template>
  <ComponentStory
    v-slot="{ properties }"
    :params="[prop('total-items').required().num(), prop('disabled').bool().widget()]"
  >
    <UiTablePagination v-bind="properties" :total-items="totalItems" />
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import { prop } from '@/libs/story/story-param'
import UiTablePagination from '@core/components/ui/table-pagination/UiTablePagination.vue'
import { ref } from 'vue'

const totalItems = ref(100)
</script>
