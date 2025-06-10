<template>
  <UiCard>
    <UiTitle>
      {{ t('storage-configuration') }}
    </UiTitle>
    <VtsLoadingHero v-if="!isReady" type="card" :title="t('storage-configuration')" />
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
            <li v-for="haSr in haSrs" :key="haSr.uuid">
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
import type { XenApiPool, XenApiSr } from '@/libs/xen-api/xen-api.types'
import { useSrStore } from '@/stores/xen-api/sr.store'
import { useVdiStore } from '@/stores/xen-api/vdi.store'
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import VtsQuickInfoRow from '@core/components/quick-info-row/VtsQuickInfoRow.vue'
import VtsLoadingHero from '@core/components/state-hero/VtsLoadingHero.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { faDatabase } from '@fortawesome/free-solid-svg-icons'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { pool } = defineProps<{
  pool: XenApiPool
}>()

const { t } = useI18n()

const { getByOpaqueRef, isReady } = useSrStore().subscribe()
const { getByOpaqueRef: getVdiByOpaqueRef } = useVdiStore().subscribe()

const defaultSr = computed(() => (pool.default_SR !== 'OpaqueRef:NULL' ? getByOpaqueRef(pool.default_SR) : undefined))
const suspendSr = computed(() =>
  pool.suspend_image_SR !== 'OpaqueRef:NULL' ? getByOpaqueRef(pool.suspend_image_SR) : undefined
)
const crashDumpSr = computed(() =>
  pool.crash_dump_SR !== 'OpaqueRef:NULL' ? getByOpaqueRef(pool.crash_dump_SR) : undefined
)

const haSrs = computed(() => {
  const haSrs = pool.ha_statefiles.filter(vdi => vdi !== undefined)

  if (haSrs.length === 0) {
    return
  }

  return haSrs.reduce((acc, vdiRef) => {
    const vdi = getVdiByOpaqueRef(vdiRef)
    if (vdi === undefined) {
      return acc
    }

    const sr = getByOpaqueRef(vdi.SR)

    return sr ? [...acc, sr] : acc
  }, [] as XenApiSr[])
})
</script>
