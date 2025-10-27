<template>
  <UiCard>
    <UiTitle>
      {{ t('storage-configuration') }}
    </UiTitle>
    <VtsStateHero v-if="!isReady" format="card" busy size="medium" />
    <template v-else>
      <UiLabelValue :label="t('default-storage-repository')">
        <template #value>
          <template v-if="defaultSr">
            <VtsIcon name="fa:database" size="medium" />
            {{ defaultSr.name_label }}
          </template>
          <template v-else>
            {{ t('none') }}
          </template>
        </template>
      </UiLabelValue>
      <UiLabelValue :label="t('suspend-storage-repository')">
        <template #value>
          <template v-if="suspendSr">
            <VtsIcon name="fa:database" size="medium" />
            {{ suspendSr.name_label }}
          </template>
          <template v-else>
            {{ t('none') }}
          </template>
        </template>
      </UiLabelValue>
      <UiLabelValue :label="t('crash-dump-storage-repository')">
        <template #value>
          <template v-if="crashDumpSr">
            <VtsIcon name="fa:database" size="medium" />
            {{ crashDumpSr.name_label }}
          </template>
          <template v-else>
            {{ t('none') }}
          </template>
        </template>
      </UiLabelValue>
      <UiLabelValue :label="t('heartbeat-storage-repository')">
        <template #value>
          <ul v-if="haSrs !== undefined && haSrs.length > 0">
            <li v-for="haSr in haSrs" :key="haSr.uuid">
              <VtsIcon name="fa:database" size="medium" />
              {{ haSr.name_label }}
            </li>
          </ul>
          <template v-else>
            {{ t('none') }}
          </template>
        </template>
      </UiLabelValue>
    </template>
  </UiCard>
</template>

<script setup lang="ts">
import type { XenApiPool, XenApiSr } from '@/libs/xen-api/xen-api.types'
import { useSrStore } from '@/stores/xen-api/sr.store'
import { useVdiStore } from '@/stores/xen-api/vdi.store'
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiLabelValue from '@core/components/ui/label-value/UiLabelValue.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
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
