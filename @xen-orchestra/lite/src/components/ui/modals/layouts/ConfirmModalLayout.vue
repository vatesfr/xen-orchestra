<template>
  <ModalContainer>
    <div class="close-bar">
      <ModalCloseIcon />
    </div>
    <ModalContent>
      <UiIcon :class="textClass" :icon="icon" class="main-icon" />
      <div v-if="$slots.title || $slots.subtitle">
        <UiTitle v-if="$slots.title" type="h4">
          <slot name="title" />
        </UiTitle>
        <div v-if="$slots.subtitle" class="subtitle">
          <slot name="subtitle" />
        </div>
      </div>
      <div v-if="$slots.default">
        <slot name="default" />
      </div>
      <UiButtonGroup>
        <slot name="buttons" />
      </UiButtonGroup>
    </ModalContent>
  </ModalContainer>
</template>

<script lang="ts" setup>
import UiIcon from "@/components/ui/icon/UiIcon.vue";
import ModalCloseIcon from "@/components/ui/modals/ModalCloseIcon.vue";
import ModalContainer from "@/components/ui/modals/ModalContainer.vue";
import ModalContent from "@/components/ui/modals/ModalContent.vue";
import UiButtonGroup from "@/components/ui/UiButtonGroup.vue";
import UiTitle from "@/components/ui/UiTitle.vue";
import { useColorContext } from "@/composables/color-context.composable";
import type { IconDefinition } from "@fortawesome/fontawesome-common-types";

defineProps<{
  icon: IconDefinition;
}>();

const { textClass } = useColorContext();
</script>

<style lang="postcss" scoped>
.close-bar {
  width: 100%;
  text-align: right;
  height: 2.5rem;
}

.main-icon {
  font-size: 4.8rem;
}

.subtitle {
  font-size: 1.6rem;
  font-weight: 400;
  color: var(--color-blue-scale-200);
}
</style>
