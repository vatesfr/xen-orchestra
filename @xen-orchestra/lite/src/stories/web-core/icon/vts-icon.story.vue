<template>
  <ComponentStory
    v-slot="{ properties }"
    :params="[
      prop('accent').enum('current', 'brand', 'success', 'warning', 'danger').required().preset('current').widget(),
      iconProp().preset(faCheck),
      prop('overlay-icon')
        .type('IconDefinition')
        .help('Meant to display a centered smaller icon on top of the main icon. See presets for examples'),
      prop('busy').bool().widget(),
      prop('fixed-width').bool().widget(),
    ]"
    :presets="{
      'Stacked Icon success circle': {
        props: {
          accent: 'success',
          icon: faCircle,
          'overlay-icon': faCheck,
        },
      },
      'Stacked Icon warning exclamation': {
        props: {
          accent: 'warning',
          icon: faCircle,
          'overlay-icon': faExclamation,
        },
      },
    }"
  >
    <VtsIcon v-bind="properties" />
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import { iconProp, prop } from '@/libs/story/story-param'
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import { faCheck, faCircle, faExclamation } from '@fortawesome/free-solid-svg-icons'
</script>
