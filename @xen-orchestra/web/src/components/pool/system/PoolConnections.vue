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
        <UiInfo :accent="server?.readOnly ? 'success' : 'muted'">
          {{ server?.readOnly ? $t('enabled') : $t('disabled') }}
        </UiInfo>
      </template>
    </VtsQuickInfoRow>
    <VtsQuickInfoRow :label="$t('self-signed-certificates')">
      <template #value>
        <UiInfo :accent="server?.allowUnauthorized ? 'success' : 'muted'">
          {{ server?.allowUnauthorized ? $t('enabled') : $t('disabled') }}
        </UiInfo>
      </template>
    </VtsQuickInfoRow>
  </UiCard>
</template>

<script setup lang="ts">
import { useServerStore } from '@/stores/xo-rest-api/server.store'
import type { XoPool } from '@/types/xo/pool.type'
import VtsQuickInfoRow from '@core/components/quick-info-row/VtsQuickInfoRow.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiInfo from '@core/components/ui/info/UiInfo.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { computed } from 'vue'

const { pool } = defineProps<{ pool: XoPool }>()

const { serverByPool } = useServerStore().subscribe()

const server = computed(() => {
  const server = serverByPool.value.get(pool.id)
  return server ? server[0] : undefined
})
</script>
