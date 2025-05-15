<template>
  <UiCard class="pool-Connection">
    <UiTitle>
      {{ $t('connections') }}
    </UiTitle>
    <VtsQuickInfoRow :label="$t('ip-address')" :value="server?.host" />
    <VtsQuickInfoRow :label="$t('proxy-url')" :value="server?.httpProxy" />
    <VtsQuickInfoRow :label="$t('username')" :value="server?.username" />
    <VtsQuickInfoRow :label="$t('read-only')">
      <template #value>
        <VtsEnabledState :enabled="server?.readOnly" />
      </template>
    </VtsQuickInfoRow>
    <VtsQuickInfoRow :label="$t('self-signed-certificates')">
      <template #value>
        <VtsEnabledState :enabled="server?.allowUnauthorized" />
      </template>
    </VtsQuickInfoRow>
  </UiCard>
</template>

<script setup lang="ts">
import { useServerStore } from '@/stores/xo-rest-api/server.store'
import type { XoPool } from '@/types/xo/pool.type'
import VtsEnabledState from '@core/components/enabled-state/VtsEnabledState.vue'
import VtsQuickInfoRow from '@core/components/quick-info-row/VtsQuickInfoRow.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { computed } from 'vue'

const { pool } = defineProps<{ pool: XoPool }>()

const { serversByPool } = useServerStore().subscribe()

const server = computed(() => {
  const server = serversByPool.value.get(pool.id)
  return server && server.length > 0 ? server[0] : undefined
})
</script>
