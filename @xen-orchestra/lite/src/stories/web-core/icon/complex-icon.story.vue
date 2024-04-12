<template>
  <ComponentStory
    v-slot="{ properties }"
    :params="[
      prop('size').enum('small', 'medium', 'large').default('medium').widget(),
      slot().help('Meant to receive two <UiIcon> components. The second icon component is the stacked icon'),
    ]"
  >
    <ComplexIcon v-bind="properties">
      <UiIcon :icon="faRotateRight" />
      <UiIcon :icon="faLightbulb" />
    </ComplexIcon>
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import { prop, slot } from '@/libs/story/story-param'
import ComplexIcon from '@core/components/icon/ComplexIcon.vue'
import UiIcon from '@core/components/icon/UiIcon.vue'
import { faLightbulb, faRotateRight } from '@fortawesome/free-solid-svg-icons'
</script>
