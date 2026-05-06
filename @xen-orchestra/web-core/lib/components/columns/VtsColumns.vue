<template>
  <div class="vts-columns" :class="{ 'extra-space-around': extraSpaceAround }">
    <component :is="nodes[index - 1] ?? VtsColumn" v-for="index of columns" :key="index" />
  </div>
</template>

<script lang="ts" setup>
import VtsColumn from '@core/components/column/VtsColumn.vue'
import { computed } from 'vue'

const { columns: _columns = 2 } = defineProps<{
  columns?: number
  extraSpaceAround?: boolean
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

  &.extra-space-around {
    margin: 0.8rem;
  }

  & > * {
    flex: 1 0 0;
  }

  @container vts-columns (max-width: 60rem) {
    & > * {
      flex-basis: 100%;
    }
  }
}
</style>
