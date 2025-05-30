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
  </UiCard>
</template>

<script setup lang="ts">
import type { XenApiPool } from '@/libs/xen-api/xen-api.types'
import { useHostStore } from '@/stores/xen-api/host.store'
import VtsEnabledState from '@core/components/enabled-state/VtsEnabledState.vue'
import VtsQuickInfoRow from '@core/components/quick-info-row/VtsQuickInfoRow.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { faServer } from '@fortawesome/free-solid-svg-icons'
import { computed } from 'vue'

const { pool } = defineProps<{
  pool: XenApiPool
}>()

const { getByUuid } = useHostStore().subscribe()

function link(obj: any, prop: string, idField = '$id') {
  const dynamicValue = obj[`$${prop}`]
  if (dynamicValue == null) {
    return dynamicValue // Properly handles null and undefined.
  }

  if (Array.isArray(dynamicValue)) {
    return dynamicValue.map(_ => _?.[idField])
  }

  return dynamicValue[idField]
}
const primaryHost = computed(() => getByUuid(link(pool, 'master')))
</script>
