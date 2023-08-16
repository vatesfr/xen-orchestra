<template>
  <div v-if="isOpen" class="ui-modal" @click.self="handleBackdropClick">
    <slot />
  </div>
</template>

<script lang="ts" setup>
import { IK_MODAL_CLOSABLE, IK_MODAL_CLOSE } from "@/types/injection-keys";
import { useMagicKeys, useVModel, whenever } from "@vueuse/core/index";
import { computed, provide } from "vue";

const props = withDefaults(
  defineProps<{
    modelValue: boolean;
    closable?: boolean;
  }>(),
  {
    closable: true,
  }
);

const emit = defineEmits<{
  (event: "update:modelValue", value: boolean): void;
}>();

provide(
  IK_MODAL_CLOSABLE,
  computed(() => props.closable)
);

const isOpen = useVModel(props, "modelValue", emit);

const close = () => (isOpen.value = false);

provide(IK_MODAL_CLOSE, close);

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
  background-color: #00000080;
  flex-direction: column;
  gap: 2rem;
  font-size: 1.6rem;
  font-weight: 400;
}
</style>
