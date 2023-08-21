<template>
  <ComponentStory
    :params="[
      model()
        .required()
        .type('boolean')
        .help('Whether the modal is opened or not'),
      colorProp().ctx(),
      slot().help('Place your ModalContainer here'),
    ]"
  >
    <button type="button" @click="open">Open modal</button>
    <UiModal v-model="isOpen" />
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from "@/components/component-story/ComponentStory.vue";
import UiModal from "@/components/ui/modals/UiModal.vue";
import useModal from "@/composables/modal.composable";
import { colorProp, model, slot } from "@/libs/story/story-param";

const { isOpen, open } = useModal();
</script>
