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
  {
    title: 'Title 1',
    content:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed non risus. Suspendisse lectus tortor, dignissim sit amet, adipiscing nec, ultricies sed, dolor. Cras elementum ultrices diam. Maecenas ligula massa, varius a, semper congue, euismod non, mi.',
  },
  {
    title: 'Title 2',
    content:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed non risus. Suspendisse lectus tortor, dignissim sit amet, adipiscing nec, ultricies sed, dolor. Cras elementum ultrices diam. Maecenas ligula massa, varius a, semper congue, euismod non, mi.',
  },
  {
    title: 'Title 3',
    content:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed non risus. Suspendisse lectus tortor, dignissim sit amet, adipiscing nec, ultricies sed, dolor. Cras elementum ultrices diam. Maecenas ligula massa, varius a, semper congue, euismod non, mi.',
  },
])
</script>
