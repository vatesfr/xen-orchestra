<template>
  <ComponentStory
    v-slot="{ properties, settings }"
    :params="[
      slot(),
      slot('actions').help('Meant to receive actions item like buttons'),
      setting('defaultSlot').widget(text()).preset('message'),
    ]"
  >
    <UiTableActions v-bind="properties">
      {{ settings.defaultSlot }}
      <template #actions>
        <UiButton
          v-for="(label, index) in buttonLabels"
          :key="index"
          :left-icon="label.icon"
          level="tertiary"
          color="normal"
          size="medium"
        >
          {{ label.title }}
        </UiButton>
      </template>
    </UiTableActions>
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import { setting, slot } from '@/libs/story/story-param'
import { text } from '@/libs/story/story-widget'
import UiButton from '@core/components/button/UiButton.vue'
import UiTableActions from '@core/components/ui/table-actions/UiTableActions.vue'
import {
  faArrowsAlt,
  faBuildingCircleArrowRight,
  faCalendarDays,
  faCircleChevronRight,
  faSoap,
} from '@fortawesome/free-solid-svg-icons'
import { ref } from 'vue'

const buttonLabels = ref([
  { title: 'Label', icon: faArrowsAlt },
  { title: 'Label', icon: faCircleChevronRight },
  { title: 'Label', icon: faCalendarDays },
  { title: 'Label', icon: faBuildingCircleArrowRight },
  { title: 'Label', icon: faSoap },
])
</script>
