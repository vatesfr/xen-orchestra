<template>
  <VtsCardRowKeyValue>
    <template #key>
      {{ label }}
    </template>
    <template #value>
      <UiLink size="small" icon="fa:city" :to="`/pool/${pool.id}`">
        {{ pool.name_label }}
      </UiLink>
    </template>
  </VtsCardRowKeyValue>
</template>

<script lang="ts" setup>
import type { XoPool } from '@/types/xo/pool.type.ts'
import VtsCardRowKeyValue from '@core/components/card/VtsCardRowKeyValue.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'

defineProps<{
  pool: XoPool
  label?: string
}>()
</script>
