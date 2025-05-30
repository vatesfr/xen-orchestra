<template>
  <UiCard>
    <UiTitle>
      {{ $t('storage-configuration') }}
    </UiTitle>
    <VtsQuickInfoRow :label="$t('default-storage-repository')">
      <template #value>
        <UiLink v-if="defaultSr" :icon="faDatabase" size="medium">
          {{ defaultSr.name_label }}
        </UiLink>
        <template v-else>
          {{ $t('none') }}
        </template>
      </template>
    </VtsQuickInfoRow>
    <VtsQuickInfoRow :label="$t('suspend-storage-repository')">
      <template #value>
        <UiLink v-if="suspendSr" :icon="faDatabase" size="medium">
          {{ suspendSr.name_label }}
        </UiLink>
        <template v-else>
          {{ $t('none') }}
        </template>
      </template>
    </VtsQuickInfoRow>
    <VtsQuickInfoRow :label="$t('crash-dump-storage-repository')">
      <template #value>
        <UiLink v-if="crashDumpSr" :icon="faDatabase" size="medium">
          {{ crashDumpSr.name_label }}
        </UiLink>
        <template v-else>
          {{ $t('none') }}
        </template>
      </template>
    </VtsQuickInfoRow>
    <VtsQuickInfoRow :label="$t('heartbeat-storage-repository')">
      <template #value>
        <ul v-if="haSrs !== undefined && haSrs.length > 0">
          <li v-for="haSr in haSrs" :key="haSr.uuid">
            <UiLink :icon="faDatabase" size="medium">
              {{ haSr.name_label }}
            </UiLink>
          </li>
        </ul>
        <template v-else>
          {{ $t('none') }}
        </template>
      </template>
    </VtsQuickInfoRow>
  </UiCard>
</template>

<script setup lang="ts">
import type { XenApiPool, XenApiSr } from '@/libs/xen-api/xen-api.types'
import { useSrStore } from '@/stores/xen-api/sr.store'
import VtsQuickInfoRow from '@core/components/quick-info-row/VtsQuickInfoRow.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { faDatabase } from '@fortawesome/free-solid-svg-icons'
import { computed } from 'vue'

const { pool } = defineProps<{
  pool: XenApiPool
}>()

const { getByOpaqueRef } = useSrStore().subscribe()

const defaultSr = computed(() => (pool.default_SR ? getByOpaqueRef(pool.default_SR) : undefined))
const suspendSr = computed(() => (pool.suspendSr ? getByOpaqueRef(pool.suspendSr) : undefined))
const crashDumpSr = computed(() => (pool.crashDumpSr ? getByOpaqueRef(pool.crashDumpSr) : undefined))

// dont works
const haSrs = computed(() => {
  const haSrs = pool.ha_statefiles.filter(vdi => vdi !== undefined)
  if (haSrs === undefined || haSrs?.length === 0) {
    return
  }

  return haSrs.reduce((acc, srId) => {
    const sr = getByOpaqueRef(srId)

    return sr ? [...acc, sr] : acc
  }, [] as XenApiSr[])
})
</script>
