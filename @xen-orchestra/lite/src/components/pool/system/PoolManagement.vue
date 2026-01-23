<template>
  <UiCard>
    <UiTitle>
      {{ t('pool-management') }}
    </UiTitle>
    <VtsStateHero v-if="!isReady" format="card" type="busy" size="medium" />
    <template v-else>
      <VtsQuickInfoRow :label="t('master')">
        <template #value>
          <UiLink v-if="masterHost" icon="object:host" :to="`/host/${masterHost.uuid}/`" size="medium">
            {{ masterHost.name_label }}
          </UiLink>
          <template v-else>
            {{ t('none') }}
          </template>
        </template>
      </VtsQuickInfoRow>
      <VtsQuickInfoRow :label="t('auto-power')">
        <template #value>
          <VtsStatus :status="pool.other_config.auto_poweron === 'true'" />
        </template>
      </VtsQuickInfoRow>
      <VtsQuickInfoRow :label="t('high-availability')">
        <template #value>
          <VtsStatus :status="Boolean(pool.ha_enabled)" />
        </template>
      </VtsQuickInfoRow>
      <VtsQuickInfoRow :label="t('migration-compression')">
        <template #value>
          <VtsStatus :status="pool.migration_compression ?? false" />
        </template>
      </VtsQuickInfoRow>
    </template>
  </UiCard>
</template>

<script setup lang="ts">
import type { XenApiPool } from '@/libs/xen-api/xen-api.types'
import { usePoolStore } from '@/stores/xen-api/pool.store'
import VtsQuickInfoRow from '@core/components/quick-info-row/VtsQuickInfoRow.vue'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import VtsStatus from '@core/components/status/VtsStatus.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { useI18n } from 'vue-i18n'

defineProps<{
  pool: XenApiPool
}>()

const { t } = useI18n()

const { masterHost, isReady } = usePoolStore().subscribe()
</script>
