<template>
  <UiCard>
    <UiTitle>
      {{ $t('networking') }}
    </UiTitle>
    <VtsLoadingHero v-if="!isReady" type="card" :title="$t('networking')" />
    <template v-else>
      <VtsQuickInfoRow :label="$t('backup-network')">
        <template #value>
          <UiLink
            v-if="backupNetwork !== undefined"
            :to="`/pool/${pool.uuid}/network?id=${backupNetwork.uuid}`"
            :icon="faNetworkWired"
            size="medium"
          >
            {{ backupNetwork.name_label }}
          </UiLink>
          <template v-else>
            {{ $t('none') }}
          </template>
        </template>
      </VtsQuickInfoRow>
    </template>
  </UiCard>
</template>

<script setup lang="ts">
import type { XenApiNetwork, XenApiPool } from '@/libs/xen-api/xen-api.types'
import { useNetworkStore } from '@/stores/xen-api/network.store'
import VtsQuickInfoRow from '@core/components/quick-info-row/VtsQuickInfoRow.vue'
import VtsLoadingHero from '@core/components/state-hero/VtsLoadingHero.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { faNetworkWired } from '@fortawesome/free-solid-svg-icons'
import { computed } from 'vue'

const { pool } = defineProps<{
  pool: XenApiPool
}>()

const { getByUuid, isReady } = useNetworkStore().subscribe()

const backupNetwork = computed(() =>
  pool.other_config['xo:backupNetwork']
    ? getByUuid(pool.other_config['xo:backupNetwork'] as XenApiNetwork['uuid'])
    : undefined
)
</script>
