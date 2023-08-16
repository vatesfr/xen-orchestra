<template>
  <div :class="[backgroundClass, { nested: isNested }]" class="modal-container">
    <slot name="default" />
  </div>
</template>

<script lang="ts" setup>
import { useColorContext } from "@/composables/color-context.composable";
import type { Color } from "@/types";
import { IK_MODAL_NESTED } from "@/types/injection-keys";
import { inject, provide } from "vue";

const props = defineProps<{
  color?: Color;
}>();

defineSlots<{
  default: () => any;
}>();

const { backgroundClass } = useColorContext(() => props.color);

const isNested = inject(IK_MODAL_NESTED, false);
provide(IK_MODAL_NESTED, true);
</script>

<style lang="postcss" scoped>
.modal-container {
  display: flex;
  flex-direction: column;
  max-width: calc(100vw - 2rem);
  max-height: calc(100vh - 20rem);
  padding: 2rem;
  gap: 2rem;
  border-radius: 1rem;
  font-size: 1.6rem;

  &:not(.nested) {
    min-width: 40rem;
    box-shadow: var(--shadow-400);
  }
}
</style>
