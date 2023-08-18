<template>
  <component :is="tag" class="ui-accent" :class="textClass">
    <slot />
  </component>
</template>

<script setup lang="ts">
import { useColorContext } from "@/composables/color-context.composable";
import type { Color } from "@/types";

const props = withDefaults(
  defineProps<{
    tag?: string;
    color?: Color;
  }>(),
  { tag: "span" }
);

const { textClass } = useColorContext(() => props.color);
</script>

<style scoped lang="postcss"></style>
