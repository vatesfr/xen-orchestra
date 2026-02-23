<template>
  <UiCheckbox v-model="state" accent="brand" />
  <div class="devPage">
    <UiAccordionList>
      <UiAccordionItem
        v-for="(tab, i) in tabs"
        :key="tab.value"
        :title="tab.title"
        :content="tab.content"
        :size="state ? 'small' : 'large'"
        :disabled="i == 1"
        :identifier="i"
      />
    </UiAccordionList>
  </div>
</template>

<script setup lang="ts">
import UiAccordionList from '@core/components/ui/accordion/UiAccordionList.vue'
import UiAccordionItem from '@core/components/ui/accordion-item/UiAccordionItem.vue'
import UiCheckbox from '@core/components/ui/checkbox/UiCheckbox.vue'
import { ref } from 'vue'

const state = ref(true)

const tabs = ref([
  {
    title: 'Title 1',
    content:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed non risus. Suspendisse lectus tortor, dignissim sit amet, adipiscing nec, ultricies sed, dolor. Cras elementum ultrices diam. Maecenas ligula massa, varius a, semper congue, euismod non, mi.',
    value: '0',
  },
  {
    title: 'Title disabled',
    content:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed non risus. Suspendisse lectus tortor, dignissim sit amet, adipiscing nec, ultricies sed, dolor. Cras elementum ultrices diam. Maecenas ligula massa, varius a, semper congue, euismod non, mi.',
    value: '1',
  },
  {
    title: 'Title 3',
    content:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed non risus. Suspendisse lectus tortor, dignissim sit amet, adipiscing nec, ultricies sed, dolor. Cras elementum ultrices diam. Maecenas ligula massa, varius a, semper congue, euismod non, mi.',
    value: '2',
  },
  {
    title: 'Title 4',
    content:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed non risus. Suspendisse lectus tortor, dignissim sit amet, adipiscing nec, ultricies sed, dolor. Cras elementum ultrices diam. Maecenas ligula massa, varius a, semper congue, euismod non, mi.',
    value: '2',
  },
  {
    title: 'Title 5',
    content:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed non risus. Suspendisse lectus tortor, dignissim sit amet, adipiscing nec, ultricies sed, dolor. Cras elementum ultrices diam. Maecenas ligula massa, varius a, semper congue, euismod non, mi.',
    value: '2',
  },
  {
    title: 'Title 6',
    content:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed non risus. Suspendisse lectus tortor, dignissim sit amet, adipiscing nec, ultricies sed, dolor. Cras elementum ultrices diam. Maecenas ligula massa, varius a, semper congue, euismod non, mi.',
    value: '2',
  },
])
</script>

<style lang="postcss" scoped>
.devPage {
  width: 20vw;
  margin: auto;
}
</style>
