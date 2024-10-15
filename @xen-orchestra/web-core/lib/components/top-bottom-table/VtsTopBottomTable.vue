<!-- v2 -->
<template>
  <div class="vts-top-bottom-table">
    <span class="typo p3-regular label">
      {{ $t('core.select.n-selected', { count: itemCount, total: itemsCount }) }}
    </span>

    <VtsButton color="normal" size="small" level="tertiary" @click="emit('toggleSelectAll', true)">
      {{ $t('core.select.all') }}
    </VtsButton>
    <VtsButton color="normal" size="small" level="tertiary" @click="emit('toggleSelectAll', false)">
      {{ $t('core.select.unselect') }}
    </VtsButton>
  </div>
</template>

<script setup lang="ts">
import VtsButton from '@core/components/button/VtsButton.vue'

defineProps<{
  itemCount: number
  itemsCount: number
}>()

const emit = defineEmits<{
  toggleSelectAll: [value: boolean]
}>()
</script>

<style scoped lang="postcss">
.vts-top-bottom-table {
  display: flex;
  align-items: center;
  gap: 0.8rem;

  .label {
    color: var(--color-neutral-txt-secondary);
  }
}
</style>
