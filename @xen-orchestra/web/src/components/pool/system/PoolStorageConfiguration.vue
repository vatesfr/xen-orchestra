<template>
  <UiCard>
    <UiTitle>
      {{ $t('storage-configuration') }}
    </UiTitle>
    <VtsLoadingHero v-if="!isReady" type="card" />
    <template v-else>
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
            <li v-for="haSr in haSrs" :key="haSr.id">
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
    </template>
  </UiCard>
</template>

<script setup lang="ts">
import { useSrStore } from '@/stores/xo-rest-api/sr.store'
import type { XoPool } from '@/types/xo/pool.type'
import type { XoSr } from '@/types/xo/sr.type'
import VtsQuickInfoRow from '@core/components/quick-info-row/VtsQuickInfoRow.vue'
import VtsLoadingHero from '@core/components/state-hero/VtsLoadingHero.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { faDatabase } from '@fortawesome/free-solid-svg-icons'
import { computed } from 'vue'

const { pool } = defineProps<{
  pool: XoPool
}>()

const { get: getSrById, isReady } = useSrStore().subscribe()

const defaultSr = computed(() => (pool.default_SR ? getSrById(pool.default_SR) : undefined))
const suspendSr = computed(() => (pool.suspendSr ? getSrById(pool.suspendSr) : undefined))
const crashDumpSr = computed(() => (pool.crashDumpSr ? getSrById(pool.crashDumpSr) : undefined))
const haSrs = computed(() => {
  if (pool.haSrs === undefined || pool.haSrs?.length === 0) {
    return
  }

  return pool.haSrs.reduce((acc, srId) => {
    const sr = getSrById(srId)

    return sr ? [...acc, sr] : acc
  }, [] as XoSr[])
})
</script>
