<template>
  <button class="description-toggle-button">
    <UiIcon :icon="collapsed ? faAngleUp : faAngleDown" class="description-toggle-button__icon" />
  </button>
</template>

<script lang="ts" setup>
import UiIcon from '@core/components/icon/UiIcon.vue'
import { faAngleDown, faAngleUp } from '@fortawesome/free-solid-svg-icons'

defineProps<{
  collapsed: boolean
}>()
</script>
<style lang="postcss" scoped>
.description-toggle-button {
  background: none;
  border: none;
  cursor: pointer;

  .description-toggle-button__icon {
    color: var(--color-purple-base);
  }
}
</style>
