<template>
  <UiCard>
    <UiTitle>
      {{ $t('pool-management') }}
    </UiTitle>
    <VtsLoadingHero v-if="!isReady" type="card" />
    <template v-else>
      <VtsQuickInfoRow :label="$t('master')">
        <template #value>
          <UiLink v-if="masterHost" :icon="faServer" :to="`/host/${masterHost.uuid}/`" size="medium">
            {{ masterHost.name_label }}
          </UiLink>
          <template v-else>
            {{ $t('none') }}
          </template>
        </template>
      </VtsQuickInfoRow>
      <VtsQuickInfoRow :label="$t('auto-power')">
        <template #value>
          <VtsEnabledState :enabled="pool.other_config.auto_poweron === 'true'" />
        </template>
      </VtsQuickInfoRow>
      <VtsQuickInfoRow :label="$t('high-availability')">
        <template #value>
          <VtsEnabledState :enabled="Boolean(pool.ha_enabled)" />
        </template>
      </VtsQuickInfoRow>
      <VtsQuickInfoRow :label="$t('migration-compression')">
        <template #value>
          <VtsEnabledState :enabled="pool.migration_compression ?? false" />
        </template>
      </VtsQuickInfoRow>
    </template>
  </UiCard>
</template>

<script setup lang="ts">
import type { XenApiPool } from '@/libs/xen-api/xen-api.types'
import { usePoolStore } from '@/stores/xen-api/pool.store'
import VtsEnabledState from '@core/components/enabled-state/VtsEnabledState.vue'
import VtsQuickInfoRow from '@core/components/quick-info-row/VtsQuickInfoRow.vue'
import VtsLoadingHero from '@core/components/state-hero/VtsLoadingHero.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { faServer } from '@fortawesome/free-solid-svg-icons'

defineProps<{
  pool: XenApiPool
}>()

const { masterHost, isReady } = usePoolStore().subscribe()
</script>
