<template>
  <UiCard>
    <UiTitle>
      {{ t('networking') }}
    </UiTitle>
    <VtsStateHero v-if="!areNetworksReady" format="card" type="busy" size="medium" />
    <template v-else>
      <VtsQuickInfoRow :label="t('backup-network')">
        <template #value>
          <UiLink v-if="backupNetwork !== undefined" icon="object:network" :to="backupNetworkTo" size="medium">
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
import { useXoNetworkCollection } from '@/modules/network/remote-resources/use-xo-network-collection.ts'
import type { FrontXoPool } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import { getPoolNetworkRoute } from '@/modules/network/utils/xo-network.util.ts'
import VtsQuickInfoRow from '@core/components/quick-info-row/VtsQuickInfoRow.vue'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import type { XoNetwork } from '@vates/types'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { pool } = defineProps<{
  pool: FrontXoPool
}>()

const { t } = useI18n()

const { getNetworkById, areNetworksReady } = useXoNetworkCollection()

const backupNetwork = computed(() =>
  pool.otherConfig['xo:backupNetwork']
    ? getNetworkById(pool.otherConfig['xo:backupNetwork'] as XoNetwork['id'])
    : undefined
)

const backupNetworkTo = computed(() =>
  backupNetwork.value ? getPoolNetworkRoute(backupNetwork.value.$pool, backupNetwork.value.id) : undefined
)
</script>
