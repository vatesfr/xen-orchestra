<template>
  <ComponentStory
    v-slot="{ properties, settings }"
    :params="[
      colorProp().help('Propagated*'),
      slot(),
      setting('defaultSlotContent')
        .preset('Example content for default slot')
        .widget(text())
        .help('Content for default slot'),
    ]"
  >
    <ModalContainer v-bind="properties">
      {{ settings.defaultSlotContent }}
    </ModalContainer>
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from "@/components/component-story/ComponentStory.vue";
import ModalContainer from "@/components/ui/modals/ModalContainer.vue";
import { slot, setting, colorProp } from "@/libs/story/story-param";
import { text } from "@/libs/story/story-widget";
</script>
