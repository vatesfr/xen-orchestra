<template>
  <slot :is-open="isOpen" :open="open" name="trigger" />
  <ul
    v-if="!$slots.trigger || isOpen"
    ref="menu"
    :class="{ horizontal, shadow }"
    class="app-menu"
    v-bind="$attrs"
  >
    <slot />
  </ul>
</template>

<script lang="ts" setup>
import placement, { type Options } from "placement.js";
import { inject, nextTick, provide, ref, toRef, unref, useSlots } from "vue";
import { onClickOutside, unrefElement } from "@vueuse/core";

const props = defineProps<{
  horizontal?: boolean;
  shadow?: boolean;
  disabled?: boolean;
  placement?: Options["placement"];
}>();
const slots = useSlots();
const isOpen = ref(false);
const menu = ref();
const isParentHorizontal = inject("isMenuHorizontal", undefined);
provide("isMenuHorizontal", toRef(props, "horizontal"));
provide("isMenuDisabled", toRef(props, "disabled"));

if (slots.trigger && !inject("closeMenu", false)) {
  provide("closeMenu", () => (isOpen.value = false));
}

const open = (event: PointerEvent) => {
  if (isOpen.value) {
    return (isOpen.value = false);
  }

  isOpen.value = true;

  nextTick(() => {
    onClickOutside(menu, () => (isOpen.value = false), {
      ignore: [event.currentTarget as HTMLElement],
    });

    placement(event.currentTarget as HTMLElement, unrefElement(menu), {
      placement:
        props.placement ??
        (unref(isParentHorizontal) !== false ? "bottom-start" : "right-start"),
    });
  });
};
</script>

<style lang="postcss" scoped>
.app-menu {
  z-index: 1;
  display: inline-flex;
  flex-direction: column;
  padding: 0.5rem;
  cursor: default;
  color: var(--color-blue-scale-200);
  border-radius: 0.8rem;
  background-color: var(--color-blue-scale-500);
  gap: 0.5rem;

  &.horizontal {
    flex-direction: row;
  }

  &.shadow {
    box-shadow: var(--shadow-300);
  }
}
</style>
