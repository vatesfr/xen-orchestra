<template>
  <Teleport to="body">
    <div v-if="isOpen" class="ui-modal" @click.self="handleBackdropClick">
      <slot />
    </div>
  </Teleport>
</template>

<script lang="ts" setup>
import { useContext } from "@/composables/context.composable";
import { ColorContext } from "@/context";
import type { Color } from "@/types";
import { IK_MODAL_CLOSE } from "@/types/injection-keys";
import { useMagicKeys, useVModel, whenever } from "@vueuse/core/index";
import { provide } from "vue";

const props = withDefaults(
  defineProps<{
    modelValue: boolean;
    closable?: boolean;
    color?: Color;
  }>(),
  {
    closable: true,
  }
);

const emit = defineEmits<{
  (event: "update:modelValue", value: boolean): void;
}>();

const isOpen = useVModel(props, "modelValue", emit);

const close = () => (isOpen.value = false);

provide(IK_MODAL_CLOSE, close);

useContext(ColorContext, () => props.color);

const handleBackdropClick = () => {
  if (props.closable) {
    close();
  }
};

const { escape } = useMagicKeys();
whenever(escape, () => close());
</script>

<style lang="postcss" scoped>
.ui-modal {
  position: fixed;
  z-index: 2;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  display: flex;
  overflow: auto;
  align-items: center;
  justify-content: center;
  background: rgba(26, 27, 56, 0.25);
  flex-direction: column;
  gap: 2rem;
  font-size: 1.6rem;
  font-weight: 400;
}
</style>
