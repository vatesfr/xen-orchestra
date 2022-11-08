<template>
  <component :is="tag" :class="type" class="ui-title">
    <slot />
  </component>
</template>

<script lang="ts" setup>
import { computed } from "vue";

const props = defineProps<{
  type: "display" | "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
}>();

const tag = computed(() => {
  if (props.type === "display") {
    return "h1";
  }

  return props.type;
});
</script>

<style lang="postcss" scoped>
.ui-title {
  line-height: 150%;
  align-self: stretch;
  flex-grow: 0;
  color: var(--color-blue-scale-100);

  &.display {
    font-size: 6.4rem;
    font-weight: 900;
  }

  &.h1 {
    font-size: 4.8rem;
    font-weight: 900;
  }

  &.h2 {
    font-size: 3.6rem;
    font-weight: 400;
  }

  &.h3 {
    font-size: 2.4rem;
    font-weight: 900;
  }

  &.h4 {
    font-size: 2rem;
    font-weight: 500;
  }

  &.h5 {
    font-size: 1.6rem;
    font-weight: 500;
  }

  &.h6 {
    font-size: 1.3rem;
    font-weight: 400;
  }
}
</style>
