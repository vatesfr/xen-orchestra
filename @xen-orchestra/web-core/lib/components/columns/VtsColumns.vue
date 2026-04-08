<template>
  <div class="vts-columns">
    <component :is="nodes[index - 1] ?? VtsColumn" v-for="index of columns" :key="index" />
  </div>
</template>

<script lang="ts" setup>
import VtsColumn from '@core/components/column/VtsColumn.vue'
import { computed } from 'vue'

const { columns: _columns = 2 } = defineProps<{
  columns?: number
}>()

const slots = defineSlots<{
  default(): any
}>()

const nodes = computed(() => slots.default())

const columns = computed(() => Math.max(_columns, nodes.value.length))
</script>

<style lang="postcss" scoped>
.vts-columns {
  container-type: inline-size;
  container-name: vts-columns;
  display: flex;
  flex-wrap: wrap;
  gap: 0.8rem;
  padding: 0.8rem;
}
</style>
