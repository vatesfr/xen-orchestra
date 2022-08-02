<template>
  <slot :open="open" :is-open="isOpen" name="trigger" />
  <Teleport v-if="isOpen" to="body">
    <UiMenu ref="menu">
      <slot />
    </UiMenu>
  </Teleport>
</template>

<script lang="ts" setup>
import { nextTick, provide, ref } from "vue";
import { onClickOutside } from "@vueuse/core";
import UiMenu from "@/components/ui/UiMenu.vue";
import placement from "placement.js";

const props =
  defineProps<{
    placement?:
      | 'top'
      | 'top-start'
      | 'top-end'
      | 'bottom'
      | 'bottom-start'
      | 'bottom-end'
      | 'right'
      | 'right-start'
      | 'right-end'
      | 'left'
      | 'left-start'
      | 'left-end',
  }>();

const menu = ref();
const isOpen = ref(false);
const open = (event: PointerEvent) => {
  isOpen.value = true;
  nextTick(() => {
    placement(
      event.currentTarget as HTMLElement,
      menu.value.$el,
      {
        placement: props.placement ?? 'bottom-start',
      }
    )
  });
};

const close = () => (isOpen.value = false);
provide("appMenuClose", close);

onClickOutside(menu, (event) => {
  (event as unknown as PointerEvent).stopPropagation();
  close();
});
</script>

<style scoped>
</style>
