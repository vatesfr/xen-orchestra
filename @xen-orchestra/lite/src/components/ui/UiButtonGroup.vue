<template>
  <div class="ui-button-group">
    <slot />
  </div>
</template>

<script lang="ts" setup>
import { provide, toRef } from "vue";

const props = defineProps<{
  busy?: boolean;
  disabled?: boolean;
  color?: "default" | "action";
}>();
provide("isButtonGroupBusy", toRef(props, "busy"));
provide("isButtonGroupDisabled", toRef(props, "disabled"));
provide("buttonGroupColor", toRef(props, "color"));
</script>

<style scoped>
.ui-button-group {
  display: flex;
  justify-content: left;
  align-items: center;
  gap: 1rem;
}
</style>
