<template>
  <UiCard>
    <UiTitle>
      {{ $t('networking') }}
    </UiTitle>
    <VtsQuickInfoRow :label="$t('backup-network')">
      <template #value>
        <UiLink
          v-if="pool.otherConfig['xo:backupNetwork'] && backupNetwork?.name_label"
          :icon="faNetworkWired"
          :to="`/pool/${pool.id}/networks?id=${pool.otherConfig['xo:backupNetwork']}/`"
          size="medium"
        >
          {{ backupNetwork.name_label }}
        </UiLink>
        <template v-else>
          {{ $t('none') }}
        </template>
      </template>
    </VtsQuickInfoRow>
  </UiCard>
</template>

<script setup lang="ts">
import { useNetworkStore } from '@/stores/xo-rest-api/network.store'
import type { XoNetwork } from '@/types/xo/network.type'
import type { XoPool } from '@/types/xo/pool.type'
import VtsQuickInfoRow from '@core/components/quick-info-row/VtsQuickInfoRow.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { faNetworkWired } from '@fortawesome/free-solid-svg-icons'
import { computed } from 'vue'

const { pool } = defineProps<{
  pool: XoPool
}>()

const { get: getNetworkById } = useNetworkStore().subscribe()

const backupNetwork = computed(() =>
  pool.otherConfig['xo:backupNetwork']
    ? getNetworkById(pool.otherConfig['xo:backupNetwork'] as XoNetwork['id'])
    : undefined
)
</script>
