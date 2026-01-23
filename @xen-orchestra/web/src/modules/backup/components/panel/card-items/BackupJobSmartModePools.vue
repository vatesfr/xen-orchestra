<template>
  <VtsCardRowKeyValue>
    <template #key>
      {{ label }}
    </template>
    <template #value>
      <UiLink size="small" icon="object:pool" :to="`/pool/${pool.id}/dashboard`">
        {{ pool.name_label }}
      </UiLink>
    </template>
  </VtsCardRowKeyValue>
</template>

<script lang="ts" setup>
import type { FrontXoPool } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import VtsCardRowKeyValue from '@core/components/card/VtsCardRowKeyValue.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'

defineProps<{
  pool: FrontXoPool
  label?: string
}>()
</script>
