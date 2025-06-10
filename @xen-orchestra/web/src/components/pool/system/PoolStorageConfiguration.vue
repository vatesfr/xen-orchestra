<template>
  <UiCard>
    <UiTitle>
      {{ t('storage-configuration') }}
    </UiTitle>
    <VtsLoadingHero v-if="!isReady" type="card" />
    <template v-else>
      <VtsQuickInfoRow :label="t('default-storage-repository')">
        <template #value>
          <template v-if="defaultSr">
            <VtsIcon :icon="faDatabase" accent="current" />
            {{ defaultSr.name_label }}
          </template>
          <template v-else>
            {{ t('none') }}
          </template>
        </template>
      </VtsQuickInfoRow>
      <VtsQuickInfoRow :label="t('suspend-storage-repository')">
        <template #value>
          <template v-if="suspendSr">
            <VtsIcon :icon="faDatabase" accent="current" />
            {{ suspendSr.name_label }}
          </template>
          <template v-else>
            {{ t('none') }}
          </template>
        </template>
      </VtsQuickInfoRow>
      <VtsQuickInfoRow :label="t('crash-dump-storage-repository')">
        <template #value>
          <template v-if="crashDumpSr">
            <VtsIcon :icon="faDatabase" accent="current" />
            {{ crashDumpSr.name_label }}
          </template>
          <template v-else>
            {{ t('none') }}
          </template>
        </template>
      </VtsQuickInfoRow>
      <VtsQuickInfoRow :label="t('heartbeat-storage-repository')">
        <template #value>
          <ul v-if="haSrs !== undefined && haSrs.length > 0">
            <li v-for="haSr in haSrs" :key="haSr.id">
              <VtsIcon :icon="faDatabase" accent="current" />
              {{ haSr.name_label }}
            </li>
          </ul>
          <template v-else>
            {{ t('none') }}
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
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import VtsQuickInfoRow from '@core/components/quick-info-row/VtsQuickInfoRow.vue'
import VtsLoadingHero from '@core/components/state-hero/VtsLoadingHero.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { faDatabase } from '@fortawesome/free-solid-svg-icons'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { pool } = defineProps<{
  pool: XoPool
}>()

const { t } = useI18n()

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
