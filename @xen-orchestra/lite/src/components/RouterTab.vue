<template>
  <RouterLink v-slot="{ isActive, href }" :to="isDisabled ? '' : to" custom>
    <UiTab :active="isActive" :disabled="disabled" :href="href" tag="a">
      <slot />
    </UiTab>
  </RouterLink>
</template>

<script lang="ts" setup>
import { useContext } from "@/composables/context.composable";
import { DisabledContext } from "@/context";
import type { RouteLocationRaw } from "vue-router";
import UiTab from "@/components/ui/UiTab.vue";

const props = withDefaults(
  defineProps<{
    to: RouteLocationRaw;
    disabled?: boolean;
  }>(),
  { disabled: undefined }
);

const isDisabled = useContext(DisabledContext, () => props.disabled);
</script>

<style lang="postcss" scoped></style>
