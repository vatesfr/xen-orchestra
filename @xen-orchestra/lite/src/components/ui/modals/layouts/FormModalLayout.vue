<template>
  <ModalContainer>
    <div :class="borderClass" class="title-bar">
      <UiIcon :class="textClass" :icon="icon" />
      <slot name="title" />
      <ModalCloseIcon />
    </div>
    <slot />
    <UiButtonGroup>
      <slot name="buttons" />
    </UiButtonGroup>
  </ModalContainer>
</template>

<script lang="ts" setup>
import UiIcon from "@/components/ui/icon/UiIcon.vue";
import ModalCloseIcon from "@/components/ui/modals/ModalCloseIcon.vue";
import ModalContainer from "@/components/ui/modals/ModalContainer.vue";
import UiButtonGroup from "@/components/ui/UiButtonGroup.vue";
import { useColorContext } from "@/composables/color-context.composable";
import type { IconDefinition } from "@fortawesome/fontawesome-common-types";

defineProps<{
  icon?: IconDefinition;
}>();

const { textClass, borderClass } = useColorContext();
</script>

<style lang="postcss" scoped>
.ui-button-group {
  justify-content: flex-end;
}

.title-bar {
  display: flex;
  border-bottom-width: 1px;
  border-bottom-style: solid;
  font-size: 2.4rem;
  gap: 1rem;
  padding-bottom: 1rem;
  font-weight: 500;
}

.modal-close-icon {
  margin-left: auto;
}
</style>
