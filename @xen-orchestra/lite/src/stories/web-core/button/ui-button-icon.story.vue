<template>
  <ComponentStory
    v-slot="{ properties }"
    :params="[
      iconProp().preset(faEllipsis),
      prop('accent').required().enum('info', 'success', 'warning', 'danger').preset('info').widget(),
      prop('size').required().enum('small', 'medium', 'large').preset('medium').widget(),
      prop('disabled').bool().widget(),
      prop('selected').bool().widget(),
      prop('dot').bool().widget(),
      prop('overlay-icon')
        .type('IconDefinition')
        .widget(
          choice(
            { label: 'Ship', value: faShip },
            { label: 'Rocket', value: faRocket },
            { label: 'Floppy', value: faFloppyDisk },
            { label: 'Trash', value: faTrash }
          )
        ),
      prop('targetScale')
        .type('number | { x: number; y: number }')
        .default(1)
        .preset({ x: 2, y: 2 })
        .help('Meant to increase click target size if needed')
        .widget(),
    ]"
  >
    <UiButtonIcon v-bind="properties" />
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import { iconProp, prop } from '@/libs/story/story-param'
import { choice } from '@/libs/story/story-widget'
import UiButtonIcon from '@core/components/ui/button-icon/UiButtonIcon.vue'
import { faEllipsis, faFloppyDisk, faRocket, faShip, faTrash } from '@fortawesome/free-solid-svg-icons'
</script>
