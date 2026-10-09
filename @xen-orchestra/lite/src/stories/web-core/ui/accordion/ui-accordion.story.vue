<template>
  <ComponentStory
    v-slot="{ properties }"
    :params="[
      prop('size').type(`'small' | 'large'`).enum('small', 'large').required().preset('large').widget(),
      prop('titleTag')
        .type(`'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'`)
        .enum('h1', 'h2', 'h3', 'h4', 'h5', 'h6')
        .required()
        .preset('h3')
        .widget(),
      prop('unique').bool().default(false).widget().help('Only one item can be expanded at a time.'),
      slot().help('A list of UiAccordionItem, each one optionally bound with v-model:expanded'),
    ]"
  >
    <div class="controls">
      <UiButton
        v-for="section of sections"
        :key="section.label"
        variant="secondary"
        accent="brand"
        size="small"
        @click="section.isExpanded = !section.isExpanded"
      >
        Toggle "{{ section.label }}"
      </UiButton>
      <UiButton variant="secondary" accent="brand" size="small" @click="setAllExpanded(true)">Expand all</UiButton>
      <UiButton variant="secondary" accent="brand" size="small" @click="setAllExpanded(false)">Collapse all</UiButton>
      <code>expanded: {{ expandedLabels }}</code>
    </div>

    <UiAccordion v-bind="properties">
      <UiAccordionItem v-for="section of sections" :key="section.label" v-model:expanded="section.isExpanded">
        <UiAccordionItemTitle>{{ section.label }}</UiAccordionItemTitle>
        <UiAccordionItemContent>{{ content }}</UiAccordionItemContent>
      </UiAccordionItem>

      <UiAccordionItem>
        <UiAccordionItemTitle>With link (no v-model)</UiAccordionItemTitle>
        <UiAccordionItemContent>
          Lorem ipsum <UiLink href="#" size="medium">foo</UiLink> dolor sit amet, consectetur adipisicing elit.
        </UiAccordionItemContent>
      </UiAccordionItem>

      <UiAccordionItem disabled>
        <UiAccordionItemTitle>Disabled</UiAccordionItemTitle>
        <UiAccordionItemContent>Disabled content</UiAccordionItemContent>
      </UiAccordionItem>
    </UiAccordion>
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import { prop, slot } from '@/libs/story/story-param.ts'
import UiAccordionItem from '@core/components/ui/accordion/accordion-item/UiAccordionItem.vue'
import UiAccordionItemContent from '@core/components/ui/accordion/accordion-item-content/UiAccordionItemContent.vue'
import UiAccordionItemTitle from '@core/components/ui/accordion/accordion-item-title/UiAccordionItemTitle.vue'
import UiAccordion from '@core/components/ui/accordion/UiAccordion.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import { computed, ref } from 'vue'

const content =
  'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed non risus. Suspendisse lectus tortor, dignissim sit amet, adipiscing nec, ultricies sed, dolor.'

const sections = ref([
  { label: 'Title 1', isExpanded: false },
  { label: 'Title 2', isExpanded: false },
  { label: 'Title 3', isExpanded: false },
])

const expandedLabels = computed(() =>
  sections.value.filter(section => section.isExpanded).map(section => section.label)
)

function setAllExpanded(isExpanded: boolean) {
  sections.value.forEach(section => {
    section.isExpanded = isExpanded
  })
}
</script>

<style lang="postcss" scoped>
.controls {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.8rem;
  margin-bottom: 2.4rem;
}
</style>
