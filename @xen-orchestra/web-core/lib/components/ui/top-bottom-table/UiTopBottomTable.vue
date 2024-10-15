<!-- v2 -->
<template>
  <div class="ui-top-bottom-table">
    <span class="typo p3-regular label">
      {{ $t('core.select.n-selected', { count: itemCount, total: itemsCount }) }}
    </span>

    <UiButton accent="info" size="small" variant="tertiary" @click="emit('toggleSelectAll', true)">
      {{ $t('core.select.all') }}
    </UiButton>
    <UiButton accent="info" size="small" variant="tertiary" @click="emit('toggleSelectAll', false)">
      {{ $t('core.select.unselect') }}
    </UiButton>
  </div>
</template>

<script setup lang="ts">
import UiButton from '@core/components/ui/button/UiButton.vue'

defineProps<{
  itemCount: number
  itemsCount: number
}>()

const emit = defineEmits<{
  toggleSelectAll: [value: boolean]
}>()
</script>

<style scoped lang="postcss">
.ui-top-bottom-table {
  display: flex;
  align-items: center;
  gap: 0.8rem;

  .label {
    color: var(--color-neutral-txt-secondary);
  }
}
</style>
