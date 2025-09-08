<template>
  <UiCard>
    <UiTitle>
      {{ t('pool-management') }}
    </UiTitle>
    <VtsLoadingHero v-if="!areHostsReady" type="card" />
    <template v-else>
      <VtsQuickInfoRow :label="t('master')">
        <template #value>
          <UiLink v-if="primaryHost" icon="fa:server" :to="`/host/${pool.master}/`" size="medium">
            {{ primaryHost.name_label }}
          </UiLink>
          <template v-else>
            {{ t('none') }}
          </template>
        </template>
      </VtsQuickInfoRow>
      <VtsQuickInfoRow :label="t('auto-power')">
        <template #value>
          <VtsEnabledState :enabled="pool.auto_poweron" />
        </template>
      </VtsQuickInfoRow>
      <VtsQuickInfoRow :label="t('high-availability')">
        <template #value>
          <VtsEnabledState :enabled="pool.HA_enabled" />
        </template>
      </VtsQuickInfoRow>
      <VtsQuickInfoRow :label="t('migration-compression')">
        <template #value>
          <VtsEnabledState :enabled="pool.migrationCompression ?? false" />
        </template>
      </VtsQuickInfoRow>
    </template>
  </UiCard>
</template>

<script setup lang="ts">
import { useXoHostCollection } from '@/remote-resources/use-xo-host-collection.ts'
import type { XoPool } from '@/types/xo/pool.type'
import VtsEnabledState from '@core/components/enabled-state/VtsEnabledState.vue'
import VtsQuickInfoRow from '@core/components/quick-info-row/VtsQuickInfoRow.vue'
import VtsLoadingHero from '@core/components/state-hero/VtsLoadingHero.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { useI18n } from 'vue-i18n'

const { pool } = defineProps<{
  pool: XoPool
}>()

const { t } = useI18n()

const { useGetHostById, areHostsReady } = useXoHostCollection()

const primaryHost = useGetHostById(() => pool.master)
</script>
