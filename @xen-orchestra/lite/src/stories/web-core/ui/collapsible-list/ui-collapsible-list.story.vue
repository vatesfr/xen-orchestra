<template>
  <ComponentStory
    v-slot="{ properties }"
    :params="[
      prop('tag').required().preset('ul').widget().help('HTML tag to use for the collapsible-list'),
      prop('total-items')
        .num()
        .required()
        .preset(vms.length)
        .help('Total number of elements. Used to display the remaining elements when collapsed'),
      prop('visible-items').num().default(5).widget().help('Number of elements to display when collapsed'),
      slot().help('Meant to receive the elements that will be collapsed'),
    ]"
  >
    <UiCollapsibleList v-bind="properties">
      <li v-for="vm in vms" :key="vm.id">
        <UiLink :icon="faDesktop" size="medium" to="#">
          {{ vm.name_label }}
        </UiLink>
      </li>
    </UiCollapsibleList>
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import { prop, slot } from '@/libs/story/story-param.ts'
import UiCollapsibleList from '@core/components/ui/collapsible-list/UiCollapsibleList.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import { faDesktop } from '@fortawesome/free-solid-svg-icons'
import { computed } from 'vue'

const vms = computed(() => [
  { id: '1', name_label: 'VM 1' },
  { id: '2', name_label: 'VM 2' },
  { id: '3', name_label: 'VM 3' },
  { id: '4', name_label: 'VM 4' },
  { id: '5', name_label: 'VM 5' },
  { id: '6', name_label: 'VM 6' },
  { id: '7', name_label: 'VM 7' },
  { id: '8', name_label: 'VM 8' },
  { id: '9', name_label: 'VM 9' },
  { id: '10', name_label: 'VM 10' },
])
</script>
