<template>
  <ComponentStory
    v-slot="{ properties }"
    :params="[model().type('string').preset('').help('The search query used to filter the treeview')]"
  >
    <VtsTreeSearch v-bind="properties" />
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import { model } from '@/libs/story/story-param.ts'
import VtsTreeSearch from '@core/components/tree/VtsTreeSearch.vue'
</script>
