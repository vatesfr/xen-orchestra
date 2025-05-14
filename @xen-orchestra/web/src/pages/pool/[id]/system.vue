<template>
  <div class="system" :class="{ mobile: uiStore.isMobile }">
    <div class="column" />
    <div class="column" />
  </div>
</template>

<script setup lang="ts">
import type { XoPool } from '@/types/xo/pool.type'
import { useUiStore } from '@core/stores/ui.store'

defineProps<{ pool: XoPool }>()

const uiStore = useUiStore()
</script>

<style scoped lang="postcss">
.system {
  display: flex;
  gap: 0.8rem;
  padding: 0.8rem;
  width: 100%;
  flex-direction: row;

  .column {
    display: flex;
    flex-direction: column;
    gap: 0.8rem;
    width: 50%;
  }

  &.mobile {
    flex-direction: column;

    .column {
      width: 100%;
    }
  }
}
</style>
