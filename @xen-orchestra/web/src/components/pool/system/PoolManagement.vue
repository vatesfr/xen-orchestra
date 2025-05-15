<template>
  <UiCard class="pool-management">
    <UiTitle>
      {{ $t('pool-management') }}
    </UiTitle>
    <VtsQuickInfoRow :label="$t('primary-host')">
      <template #value>
        <UiLink v-if="primaryHost" :icon="faServer" :to="`/host/${pool.master}`" size="small">
          {{ primaryHost.name_label }}
        </UiLink>
        <template v-else>
          {{ $t('none') }}
        </template>
      </template>
    </VtsQuickInfoRow>
    <VtsQuickInfoRow :label="$t('auto-power')">
      <template v-if="pool.auto_poweron !== undefined" #value>
        <VtsEnabledState :enabled="pool.auto_poweron" />
      </template>
    </VtsQuickInfoRow>
    <VtsQuickInfoRow :label="$t('high-availability')">
      <template v-if="pool.migrationCompression !== undefined" #value>
        <VtsEnabledState :enabled="pool.migrationCompression" />
      </template>
    </VtsQuickInfoRow>
    <VtsQuickInfoRow :label="$t('migration-compression')">
      <template v-if="pool.migrationCompression !== undefined" #value>
        <VtsEnabledState :enabled="pool.migrationCompression" />
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
