<template>
  <UiLabelValue :label>
    <template #value>
      <UiLink v-for="pool in pools" :key="pool.id" size="small" icon="fa:city" :to="`/pool/${pool.id}`" class="pool">
        <span v-tooltip class="text-ellipsis">
          {{ pool.name_label }}
        </span>
      </UiLink>
    </template>
  </UiLabelValue>
</template>

<script lang="ts" setup>
import type { XoPool } from '@/types/xo/pool.type.ts'
import UiLabelValue from '@core/components/ui/label-value/UiLabelValue.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import { vTooltip } from '@core/directives/tooltip.directive'

defineProps<{
  pools: XoPool[]
  label: string
}>()
</script>

<style scoped lang="postcss">
.pool {
  width: 100%;
}
</style>
