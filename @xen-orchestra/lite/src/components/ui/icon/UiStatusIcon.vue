<template>
  <UiIcon :icon="icon" class="icon" :class="props.state" />
</template>

<script lang="ts" setup>
import UiIcon from "@/components/ui/icon/UiIcon.vue";
import { computed } from "vue";
import {
  faCheckCircle,
  faInfoCircle,
  faWarning,
} from "@fortawesome/free-solid-svg-icons";
import type { Color } from "@/types";

const props = defineProps<{
  state: Color;
}>();

const icon = computed(() => {
  switch (props.state) {
    case "error":
    case "warning":
      return faWarning;
    case "info":
      return faInfoCircle;
    default:
      return faCheckCircle;
  }
});
</script>

<style scoped lang="postcss">
.icon {
  color: var(--icon-color);

  &.error {
    --icon-color: var(--color-red-vates-base);
  }
  &.warning {
    --icon-color: var(--color-orange-world-base);
  }
  &.info {
    --icon-color: var(--color-extra-blue-base);
  }
  &.success {
    --icon-color: var(--color-green-infra-base);
  }
}
</style>
