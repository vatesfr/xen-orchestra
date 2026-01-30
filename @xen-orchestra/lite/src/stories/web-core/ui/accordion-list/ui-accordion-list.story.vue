<template>
  <ComponentStory v-slot="{ properties }" :params="[slot().help('a list of ui-accordion-item')]">
    <UiAccordionList v-bind="properties">
      <UiAccordionItem v-for="(tab, i) in tabs" :key="i" :title="tab.title" :content="tab.content" size="large" />
    </UiAccordionList>
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import { slot } from '@/libs/story/story-param'
import UiAccordionList from '@core/components/ui/accordion/UiAccordionList.vue'
import UiAccordionItem from '@core/components/ui/accordion-item/UiAccordionItem.vue'
import { ref } from 'vue'

const tabs = ref([
  { title: 'Title 1', content: 'Content 1' },
  { title: 'Title 2', content: 'Content 2' },
  { title: 'Title 3', content: 'Content 3' },
])
</script>
