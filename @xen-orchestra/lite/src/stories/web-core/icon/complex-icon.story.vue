<template>
  <ComponentStory
    v-slot="{ properties }"
    :params="[
      prop('size').enum('small', 'medium', 'large').default('medium').widget(),
      slot().help('Meant to receive two <UiIcon> components. The second icon component is the stacked icon'),
    ]"
  >
    <ComplexIcon v-bind="properties">
      <VtsIcon :icon="faRotateRight" accent="current" />
      <VtsIcon :icon="faLightbulb" accent="current" />
    </ComplexIcon>
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import { prop, slot } from '@/libs/story/story-param'
import ComplexIcon from '@core/components/icon/ComplexIcon.vue'
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import { faLightbulb, faRotateRight } from '@fortawesome/free-solid-svg-icons'
</script>
