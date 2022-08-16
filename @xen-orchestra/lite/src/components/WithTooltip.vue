<template>
  <Teleport to="body">
    <UiTooltip v-if="isVisible" ref="tooltip">
      <template v-if="label">{{ label }}</template>
      <slot name="label" v-else />
    </UiTooltip>
  </Teleport>
  <slot :events="events" :hide="hide" :show="show" />
</template>

<script lang="ts" setup>
import placement from "placement.js";
import { computed, nextTick, ref } from "vue";
import { unrefElement } from "@vueuse/core";
import UiTooltip from "@/components/ui/UiTooltip.vue";

const props = withDefaults(
  defineProps<{
    label?: string;
    showEventName?: string;
    hideEventName?: string;
    checkEllipsisHtmlSelector?: string;
  }>(),
  {
    showEventName: "mouseenter",
    hideEventName: "mouseleave",
  }
);

const tooltip = ref();
const isVisible = ref(false);
const hide = () => (isVisible.value = false);
const show = (event: MouseEvent) => {
  const target = event.currentTarget as HTMLElement;

  if (props.checkEllipsisHtmlSelector) {
    const innerElement = target.querySelector(props.checkEllipsisHtmlSelector);

    if (!innerElement) {
      return;
    }

    if (innerElement.clientWidth >= innerElement.scrollWidth) {
      return;
    }
  }

  isVisible.value = true;
  nextTick(() => {
    placement(event.currentTarget as HTMLElement, unrefElement(tooltip), {
      placement: "top",
    });
  });
};
const events = computed(() => ({
  [props.showEventName]: show,
  [props.hideEventName]: hide,
}));
</script>

<style lang="postcss" scoped></style>
