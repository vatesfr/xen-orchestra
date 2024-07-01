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
    <ObjectLink v-bind="properties">{{ settings.label }}</ObjectLink>
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import { iconProp, prop, setting, slot } from '@/libs/story/story-param'
import ObjectLink from '@core/components/object-link/ObjectLink.vue'
import { faCity } from '@fortawesome/free-solid-svg-icons'
</script>
