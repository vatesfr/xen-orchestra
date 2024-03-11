<template>
  <ComponentStory
    v-slot="{ properties }"
    :params="[
      iconProp().preset(faEllipsis),
      colorProp(),
      prop('size')
        .default('medium')
        .str()
        .widget(choice('small', 'medium', 'large')),
      prop('disabled').bool().widget(),
      prop('active').bool().widget(),
      prop('dot').bool().widget(),
    ]"
  >
    <ButtonIcon v-bind="properties" />
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import { colorProp, iconProp, prop } from '@/libs/story/story-param'
import { choice } from '@/libs/story/story-widget'
import ButtonIcon from '@core/components/button/ButtonIcon.vue'
import { faEllipsis } from '@fortawesome/free-solid-svg-icons'
</script>
