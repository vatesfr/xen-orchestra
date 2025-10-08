<template>
  <UiCard>
    <UiTitle>
      {{ t('pool-management') }}
    </UiTitle>
    <VtsStateHero v-if="!isReady" format="card" busy size="medium" />
    <template v-else>
      <UiLabelValue :label="t('master')">
        <template #value>
          <UiLink v-if="masterHost" icon="fa:server" :to="`/host/${masterHost.uuid}/`" size="medium">
            {{ masterHost.name_label }}
          </UiLink>
          <template v-else>
            {{ t('none') }}
          </template>
        </template>
      </UiLabelValue>
      <UiLabelValue :label="t('auto-power')">
        <template #value>
          <VtsStatus :status="pool.other_config.auto_poweron === 'true'" />
        </template>
      </UiLabelValue>
      <UiLabelValue :label="t('high-availability')">
        <template #value>
          <VtsStatus :status="Boolean(pool.ha_enabled)" />
        </template>
      </UiLabelValue>
      <UiLabelValue :label="t('migration-compression')">
        <template #value>
          <VtsStatus :status="pool.migration_compression ?? false" />
        </template>
      </UiLabelValue>
    </template>
  </UiCard>
</template>

<script setup lang="ts">
import type { XenApiPool } from '@/libs/xen-api/xen-api.types'
import { usePoolStore } from '@/stores/xen-api/pool.store'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import VtsStatus from '@core/components/status/VtsStatus.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiLabelValue from '@core/components/ui/label-value/UiLabelValue.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { useI18n } from 'vue-i18n'

defineProps<{
  pool: XenApiPool
}>()

const { t } = useI18n()

const { masterHost, isReady } = usePoolStore().subscribe()
</script>
