<template>
  <UiCard>
    <UiTitle>
      {{ t('networking') }}
    </UiTitle>
    <VtsStateHero v-if="!areNetworksReady" format="card" busy />
    <template v-else>
      <VtsQuickInfoRow :label="t('backup-network')">
        <template #value>
          <UiLink
            v-if="backupNetwork !== undefined"
            icon="fa:network-wired"
            :to="`/pool/${pool.id}/networks?id=${backupNetwork.id}`"
            size="medium"
          >
            {{ backupNetwork.name_label }}
          </UiLink>
          <template v-else>
            {{ t('none') }}
          </template>
        </template>
      </VtsQuickInfoRow>
    </template>
  </UiCard>
</template>

<script setup lang="ts">
import { useXoNetworkCollection } from '@/remote-resources/use-xo-network-collection.ts'
import type { XoNetwork } from '@/types/xo/network.type'
import type { XoPool } from '@/types/xo/pool.type'
import VtsQuickInfoRow from '@core/components/quick-info-row/VtsQuickInfoRow.vue'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { pool } = defineProps<{
  pool: XoPool
}>()

const { t } = useI18n()

const { getNetworkById, areNetworksReady } = useXoNetworkCollection()

const backupNetwork = computed(() =>
  pool.otherConfig['xo:backupNetwork']
    ? getNetworkById(pool.otherConfig['xo:backupNetwork'] as XoNetwork['id'])
    : undefined
)
</script>
