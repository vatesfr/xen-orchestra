<template>
  <ComponentStory
    v-slot="{ properties, settings }"
    :params="[
      prop('title').str(),
      slot(),
      slot('title').help('Meant to receive text item like title'),
      slot('groupedBy').help('Meant to receive grouped item like breadcrumb'),
      setting('titleSlotContent').widget(text()).preset('Actions title'),
    ]"
  >
    <UiTableActions v-bind="properties">
      <UiButton
        v-for="(label, index) in buttonLabels"
        :key="index"
        :left-icon="label.icon"
        variant="tertiary"
        accent="info"
        size="medium"
      >
        {{ label.title }}
      </UiButton>
      <template #title>
        <UiActionsTitle>
          {{ settings.titleSlotContent }}
        </UiActionsTitle>
      </template>
      <template #groupedBy>
        <span>Grouped By</span>
      </template>
    </UiTableActions>
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import { prop, setting, slot } from '@/libs/story/story-param'
import { text } from '@/libs/story/story-widget'
import UiActionsTitle from '@core/components/ui/actions-title/UiActionsTitle.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiTableActions from '@core/components/ui/table-actions/UiTableActions.vue'
import { faArrowsAlt, faCalendarDays, faCircleChevronRight } from '@fortawesome/free-solid-svg-icons'
import { ref } from 'vue'

const buttonLabels = ref([
  { title: 'Label', icon: faArrowsAlt },
  { title: 'Label', icon: faCircleChevronRight },
  { title: 'Label', icon: faCalendarDays },
])
</script>
