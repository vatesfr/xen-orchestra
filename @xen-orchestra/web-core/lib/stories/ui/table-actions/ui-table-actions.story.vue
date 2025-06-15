<template>
  <ComponentStory :params>
    <UiTableActions v-bind="bindings">
      <UiButton
        v-for="(label, index) in buttonLabels"
        :key="index"
        :left-icon="label.icon"
        variant="tertiary"
        accent="brand"
        size="medium"
      >
        {{ label.title }}
      </UiButton>
      <template v-if="settings.titleSlotContent" #title>
        <UiActionsTitle>
          {{ settings.titleSlotContent }}
        </UiActionsTitle>
      </template>
      <template #groupedBy>
        <span class="typo-body-regular-small">Grouped By</span>
      </template>
    </UiTableActions>
  </ComponentStory>
</template>

<script lang="ts" setup>
import UiActionsTitle from '@core/components/ui/actions-title/UiActionsTitle.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiTableActions from '@core/components/ui/table-actions/UiTableActions.vue'
import ComponentStory from '@core/packages/story/ComponentStory.vue'
import { useStory } from '@core/packages/story/use-story.ts'
import { faArrowsAlt, faCalendarDays, faCircleChevronRight } from '@fortawesome/free-solid-svg-icons'
import { ref } from 'vue'

const buttonLabels = ref([
  { title: 'Label', icon: faArrowsAlt },
  { title: 'Label', icon: faCircleChevronRight },
  { title: 'Label', icon: faCalendarDays },
])

const { params, bindings, settings } = useStory({
  props: {
    title: {
      preset: ref<string>(),
      type: 'string',
      widget: true,
    },
  },
  slots: {
    default: {
      help: 'Default slot content',
    },
    title: {
      help: 'Meant to receive text item like title',
    },
    groupedBy: {
      help: 'Meant to receive grouped item like breadcrumb',
    },
  },
  settings: {
    titleSlotContent: {
      preset: '',
    },
  },
})
</script>
