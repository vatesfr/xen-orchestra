<template>
  <ComponentStory
    v-slot="{ properties }"
    :params="[
      prop('size').required().enum('small', 'medium', 'large').preset('medium').widget(),
      slot().help('Meant to receive two <VtsIcon> components. The second icon component is the stacked icon'),
    ]"
  >
    <UiComplexIcon v-bind="properties">
      <VtsIcon :icon="faRotateRight" accent="current" />
      <VtsIcon :icon="faLightbulb" accent="current" />
    </UiComplexIcon>
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import { prop, slot } from '@/libs/story/story-param'
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import UiComplexIcon from '@core/components/ui/complex-icon/UiComplexIcon.vue'
import { faLightbulb, faRotateRight } from '@fortawesome/free-solid-svg-icons'
</script>
