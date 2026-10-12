<template>
  <ComponentStory
    v-slot="{ properties }"
    :params="[
      prop('variant').required().enum('horizontal', 'vertical').preset('vertical').widget(),
      prop('visible-items')
        .num()
        .widget()
        .help('Number of links to display when collapsed. Vertical only, and requires `total-items`'),
      prop('total-items')
        .num()
        .preset(groups.length)
        .widget()
        .help('Total number of links. Used to label the button that expands the list'),
      slot().help('Meant to receive UiLink components'),
    ]"
  >
    <UiLinkList v-bind="properties">
      <UiLink v-for="group in groups" :key="group.id" icon="table:group" size="small" to="#">
        {{ group.name }}
      </UiLink>
    </UiLinkList>
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import { prop, slot } from '@/libs/story/story-param.ts'
import UiLink from '@core/components/ui/link/UiLink.vue'
import UiLinkList from '@core/components/ui/link-list/UiLinkList.vue'

const groups = [
  { id: '1', name: 'Administrators' },
  { id: '2', name: 'Developers' },
  { id: '3', name: 'Support' },
  { id: '4', name: 'Auditors' },
  { id: '5', name: 'Operators' },
  { id: '6', name: 'Guests' },
  { id: '7', name: 'Contractors' },
]
</script>
