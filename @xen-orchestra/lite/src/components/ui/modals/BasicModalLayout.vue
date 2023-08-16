<template>
  <div :class="[bgClass, { nested: isNested }]" class="basic-modal-layout">
    <slot name="close-bar">
      <div v-if="isClosable" class="close-bar">
        <ModalCloseIcon v-if="isClosable" @click="close" />
      </div>
    </slot>
    <main v-if="$slots.default" class="main">
      <slot name="default" />
    </main>
  </div>
</template>

<script lang="ts" setup>
import ModalCloseIcon from "@/components/ui/modals/ModalCloseIcon.vue";
import { usePropagatedColor } from "@/composables/propagated-color.composable";
import type { Color } from "@/types";
import {
  IK_MODAL_CLOSABLE,
  IK_MODAL_CLOSE,
  IK_MODAL_NESTED,
} from "@/types/injection-keys";
import { computed, inject, provide } from "vue";

const props = defineProps<{
  color?: Color;
}>();

defineSlots<{
  "close-bar": () => any;
  default: () => any;
}>();

const { bgClass } = usePropagatedColor(() => props.color);

const isClosable = inject(
  IK_MODAL_CLOSABLE,
  computed(() => false)
);

const isNested = inject(IK_MODAL_NESTED, false);
provide(IK_MODAL_NESTED, true);

const close = inject(IK_MODAL_CLOSE, () => undefined);
</script>

<style lang="postcss" scoped>
.basic-modal-layout {
  display: flex;
  flex-direction: column;
  max-width: calc(100vw - 2rem);
  max-height: calc(100vh - 20rem);
  padding: 2rem;
  gap: 2rem;
  text-align: center;
  border-radius: 1rem;
  font-size: 1.6rem;

  &:not(.nested) {
    min-width: 40rem;
    box-shadow: var(--shadow-400);
  }
}

.main {
  overflow: auto;
  display: flex;
  flex-direction: column;
  gap: 2rem;
  padding: 2rem;
}

.close-bar {
  text-align: right;
  height: 2.5rem;
}
</style>
