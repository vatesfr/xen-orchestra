<template>
  <div class="infra-action">
    <slot>
      <UiIcon :icon="icon" fixed-width />
    </slot>
  </div>
</template>

<script lang="ts" setup>
import UiIcon from "@/components/ui/icon/UiIcon.vue";
import type { IconDefinition } from "@fortawesome/fontawesome-common-types";

defineProps<{
  icon?: IconDefinition;
}>();
</script>

<style lang="postcss" scoped>
.infra-action {
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  width: 3rem;
  height: 3rem;
}
</style>
