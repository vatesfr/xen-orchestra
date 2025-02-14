<!-- v2 -->
<template>
  <div class="ui-top-bottom-table">
    <div class="content">
      <span class="typo-body-regular-small label">
        {{ $t('core.select.n-selected-of', { count: selectedItems, total: totalItems }) }}
      </span>

      <UiButton
        :disabled="selectedItems === totalItems"
        accent="brand"
        size="small"
        variant="tertiary"
        @click="emit('toggleSelectAll', true)"
      >
        {{ $t('core.select.all') }}
      </UiButton>
      <UiButton
        :disabled="selectedItems === 0"
        accent="brand"
        size="small"
        variant="tertiary"
        @click="emit('toggleSelectAll', false)"
      >
        {{ $t('core.select.unselect') }}
      </UiButton>
    </div>
    <slot />
  </div>
</template>

<script setup lang="ts">
import UiButton from '@core/components/ui/button/UiButton.vue'

defineProps<{
  selectedItems: number
  totalItems: number
}>()

const emit = defineEmits<{
  toggleSelectAll: [value: boolean]
}>()

defineSlots<{
  default(): any
}>()
</script>

<style scoped lang="postcss">
.ui-top-bottom-table {
  display: flex;
  justify-content: space-between;

  .content {
    display: flex;
    align-items: center;
    gap: 0.8rem;
  }

  .label {
    color: var(--color-neutral-txt-secondary);
  }
}
</style>
