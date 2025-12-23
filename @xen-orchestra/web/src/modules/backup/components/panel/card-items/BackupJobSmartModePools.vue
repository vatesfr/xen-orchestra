<template>
  <VtsCardRowKeyValue>
    <template #key>
      {{ label }}
    </template>
    <template #value>
      <UiLink size="small" icon="fa:city" :to="`/pool/${pool.id}/dashboard`">
        {{ pool.name_label }}
      </UiLink>
    </template>
  </VtsCardRowKeyValue>
</template>

<script lang="ts" setup>
import VtsCardRowKeyValue from '@core/components/card/VtsCardRowKeyValue.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import type { XoPool } from '@vates/types'

defineProps<{
  pool: XoPool
  label?: string
}>()
</script>
