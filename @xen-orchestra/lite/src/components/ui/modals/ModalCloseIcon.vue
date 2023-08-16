<template>
  <UiIcon :class="textClass" :icon="faXmark" class="modal-close-icon" />
</template>

<script lang="ts" setup>
import UiIcon from "@/components/ui/icon/UiIcon.vue";
import { usePropagatedColor } from "@/composables/propagated-color.composable";
import { faXmark } from "@fortawesome/free-solid-svg-icons";

const { textClass } = usePropagatedColor();
</script>

<style lang="postcss" scoped>
.modal-close-icon {
  font-size: 2rem;
  cursor: pointer;
}
</style>
