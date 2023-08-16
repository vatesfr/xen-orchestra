<template>
  <ComponentStory
    :params="[
      model()
        .required()
        .type('boolean')
        .help('Whether the modal is opened or not'),
      prop('closable')
        .bool()
        .default(true)
        .widget()
        .help('If true, the modal can be closed by clicking on the overlay'),
      slot().help('Place your ModalContainer here'),
    ]"
  />
</template>

<script lang="ts" setup>
import ComponentStory from "@/components/component-story/ComponentStory.vue";
import { model, prop, slot } from "@/libs/story/story-param";
</script>
