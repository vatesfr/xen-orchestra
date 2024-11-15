<template>
  <ComponentStory
    v-slot="{ properties, settings }"
    :params="[
      prop('route').type('RouteLocationRaw').preset('#'),
      prop('disabled').bool().widget(),
      iconProp().type('IconDefinition').preset(faCity),
      slot().help('Meant to receive the object\'s label'),
      slot('icon').help('Meant to receive a UiIcon or ObjectIcon component'),
      setting('label').preset('Pool name').widget(),
    ]"
  >
    <UiObjectLink v-bind="properties">{{ settings.label }}</UiObjectLink>
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import { iconProp, prop, setting, slot } from '@/libs/story/story-param'
import UiObjectLink from '@core/components/ui/object-link/UiObjectLink.vue'
import { faCity } from '@fortawesome/free-solid-svg-icons'
</script>
