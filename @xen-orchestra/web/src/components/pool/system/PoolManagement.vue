<template>
  <UiCard>
    <UiTitle>
      {{ $t('pool-management') }}
    </UiTitle>
    <VtsQuickInfoRow :label="$t('master')">
      <template #value>
        <UiLink v-if="primaryHost" :icon="faServer" :to="`/host/${pool.master}/`" size="medium">
          {{ primaryHost.name_label }}
        </UiLink>
        <template v-else>
          {{ $t('none') }}
        </template>
      </template>
    </VtsQuickInfoRow>
    <VtsQuickInfoRow :label="$t('auto-power')">
      <template #value>
        <VtsEnabledState :enabled="pool.auto_poweron" />
      </template>
    </VtsQuickInfoRow>
    <VtsQuickInfoRow :label="$t('high-availability')">
      <template #value>
        <VtsEnabledState :enabled="pool.HA_enabled" />
      </template>
    </VtsQuickInfoRow>
    <VtsQuickInfoRow :label="$t('migration-compression')">
      <template #value>
        <VtsEnabledState :enabled="pool.migrationCompression ?? false" />
      </template>
    </VtsQuickInfoRow>
  </UiCard>
</template>

<script setup lang="ts">
import { useHostStore } from '@/stores/xo-rest-api/host.store'
import type { XoPool } from '@/types/xo/pool.type'
import VtsEnabledState from '@core/components/enabled-state/VtsEnabledState.vue'
import VtsQuickInfoRow from '@core/components/quick-info-row/VtsQuickInfoRow.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { faServer } from '@fortawesome/free-solid-svg-icons'
import { computed } from 'vue'

const { pool } = defineProps<{
  pool: XoPool
}>()

const { get: getHostById } = useHostStore().subscribe()

const primaryHost = computed(() => getHostById(pool.master))
</script>
