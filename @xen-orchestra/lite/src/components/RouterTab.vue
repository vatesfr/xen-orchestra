<template>
  <RouterLink
    v-slot="{ isActive, href }"
    :to="disabled || isTabBarDisabled ? '' : to"
    custom
  >
    <UiTab :active="isActive" :disabled="disabled" :href="href" tag="a">
      <slot />
    </UiTab>
  </RouterLink>
</template>

<script lang="ts" setup>
import { type ComputedRef, computed, inject } from "vue";
import type { RouteLocationRaw } from "vue-router";
import UiTab from "@/components/ui/UiTab.vue";

defineProps<{
  to: RouteLocationRaw;
  disabled?: boolean;
}>();

const isTabBarDisabled = inject<ComputedRef<boolean>>(
  "isTabBarDisabled",
  computed(() => false)
);
</script>

<style lang="postcss" scoped></style>
