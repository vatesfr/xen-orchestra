<template>
  <button class="description-toggle-button">
    <UiIcon v-if="isCollapsedRef" :icon="faAngleDown" class="description-toggle-button__icon" />
    <UiIcon v-else :icon="faAngleUp" class="description-toggle-button__icon" />
  </button>
</template>
<script lang="ts" setup>
import UiIcon from '@core/components/icon/UiIcon.vue'
import { faAngleDown, faAngleUp } from '@fortawesome/free-solid-svg-icons'
import { computed } from 'vue'

const props = defineProps<{
  isCollapsed: boolean
}>()

const isCollapsedRef = computed(() => props.isCollapsed)
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
