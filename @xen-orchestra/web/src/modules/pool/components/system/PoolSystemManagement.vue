<template>
  <UiCard>
    <UiTitle>
      {{ t('pool-management') }}
    </UiTitle>
    <VtsStateHero v-if="!areHostsReady" format="card" type="busy" size="medium" />
    <template v-else>
      <VtsQuickInfoRow :label="t('master')">
        <template #value>
          <UiLink v-if="primaryHost" icon="object:host" :to="`/host/${pool.master}/`" size="medium">
            {{ primaryHost.name_label }}
          </UiLink>
          <template v-else>
            {{ t('none') }}
          </template>
        </template>
      </VtsQuickInfoRow>
      <VtsQuickInfoRow :label="t('auto-power')">
        <template #value>
          <VtsStatus :status="pool.auto_poweron" />
        </template>
      </VtsQuickInfoRow>
      <VtsQuickInfoRow :label="t('high-availability')">
        <template #value>
          <VtsStatus :status="pool.HA_enabled" />
        </template>
      </VtsQuickInfoRow>
      <VtsQuickInfoRow :label="t('migration-compression')">
        <template #value>
          <VtsStatus :status="pool.migrationCompression ?? false" />
        </template>
      </VtsQuickInfoRow>
    </template>
  </UiCard>
</template>

<script setup lang="ts">
import { useXoHostCollection } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import type { FrontXoPool } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import VtsQuickInfoRow from '@core/components/quick-info-row/VtsQuickInfoRow.vue'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import VtsStatus from '@core/components/status/VtsStatus.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { useI18n } from 'vue-i18n'

const { pool } = defineProps<{
  pool: FrontXoPool
}>()

const { t } = useI18n()

const { useGetHostById, areHostsReady } = useXoHostCollection()

const primaryHost = useGetHostById(() => pool.master)
</script>
