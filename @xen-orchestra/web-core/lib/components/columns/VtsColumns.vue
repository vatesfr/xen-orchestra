<template>
  <div class="vts-columns" :class="{ mobile: uiStore.isMobile }">
    <component :is="nodes[i - 1] ?? VtsColumn" v-for="i of columns" :key="i" />
  </div>
</template>

<script lang="ts" setup>
import VtsColumn from '@core/components/column/VtsColumn.vue'
import { useUiStore } from '@core/stores/ui.store.ts'
import { computed } from 'vue'

const { columns: _columns = 2 } = defineProps<{
  columns?: number
}>()

const slots = defineSlots<{
  default(): any
}>()

const nodes = computed(() => slots.default())

const columns = computed(() => Math.max(_columns, nodes.value.length))

const uiStore = useUiStore()
</script>

<style lang="postcss" scoped>
.vts-columns {
  display: flex;
  gap: 0.8rem;
  padding: 0.8rem;
  flex-direction: row;

  &.mobile {
    flex-direction: column;
  }
}
</style>
