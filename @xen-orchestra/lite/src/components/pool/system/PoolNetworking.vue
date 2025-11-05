<template>
  <UiCard>
    <UiTitle>
      {{ t('networking') }}
    </UiTitle>
    <VtsStateHero v-if="!isReady" format="card" busy size="medium" />
    <template v-else>
      <VtsQuickInfoRow :label="t('backup-network')">
        <template #value>
          <UiLink
            v-if="backupNetwork !== undefined"
            :to="`/pool/${pool.uuid}/network?id=${backupNetwork.uuid}`"
            icon="fa:network-wired"
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
import type { XenApiNetwork, XenApiPool } from '@/libs/xen-api/xen-api.types'
import { useNetworkStore } from '@/stores/xen-api/network.store'
import VtsQuickInfoRow from '@core/components/quick-info-row/VtsQuickInfoRow.vue'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { pool } = defineProps<{
  pool: XenApiPool
}>()

const { t } = useI18n()

const { getByUuid, isReady } = useNetworkStore().subscribe()

const backupNetwork = computed(() =>
  pool.other_config['xo:backupNetwork']
    ? getByUuid(pool.other_config['xo:backupNetwork'] as XenApiNetwork['uuid'])
    : undefined
)
</script>
