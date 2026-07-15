<template>
  <VtsSidePanel :has-selection="!!sr" @close="emit('close')">
    <template v-if="sr">
      <VtsStateHero v-if="!isReady" format="panel" type="busy" size="medium" />
      <template v-else>
        <StorageRepositoryInfosCard :pool :sr />
        <StorageRepositorySpaceCard :sr />
        <StorageRepositoryVdisCard :vdis :vdi-snapshots />
        <StorageRepositoryHostsCard :hosts />
        <StorageRepositoryPbdsCard :pbds />
        <StorageRepositoryCustomFieldsCard :custom-fields />
      </template>
    </template>
  </VtsSidePanel>
</template>

<script setup lang="ts">
import type { XenApiHost, XenApiPool, XenApiSr, XenApiVdi } from '@/libs/xen-api/xen-api.types.ts'
import StorageRepositoryCustomFieldsCard from '@/modules/storage-repository/components/list/panel/cards/StorageRepositoryCustomFieldsCard.vue'
import StorageRepositoryHostsCard from '@/modules/storage-repository/components/list/panel/cards/StorageRepositoryHostsCard.vue'
import StorageRepositoryInfosCard from '@/modules/storage-repository/components/list/panel/cards/StorageRepositoryInfosCard.vue'
import StorageRepositoryPbdsCard from '@/modules/storage-repository/components/list/panel/cards/StorageRepositoryPbdsCard.vue'
import StorageRepositorySpaceCard from '@/modules/storage-repository/components/list/panel/cards/StorageRepositorySpaceCard.vue'
import StorageRepositoryVdisCard from '@/modules/storage-repository/components/list/panel/cards/StorageRepositoryVdisCard.vue'
import { useHostStore } from '@/stores/xen-api/host.store.ts'
import { usePbdStore } from '@/stores/xen-api/pbd.store.ts'
import { useVdiStore } from '@/stores/xen-api/vdi.store.ts'
import VtsSidePanel from '@core/components/panel/VtsSidePanel.vue'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import { logicAnd } from '@vueuse/math'
import { computed } from 'vue'

type EnrichedXenApiVdi = XenApiVdi & { chainPhysicalUsage: number }

const { sr, pool } = defineProps<{
  sr?: XenApiSr
  pool: XenApiPool
}>()

const emit = defineEmits<{
  close: []
}>()

const { getByOpaqueRef: getVdiByOpaqueRef, isReady: areVdisReady } = useVdiStore().subscribe()
const { getByOpaqueRef: getHostByOpaqueRef, isReady: areHostsReady } = useHostStore().subscribe()
const { getPbdsForSr, isReady: arePbdsReady } = usePbdStore().subscribe()

const isReady = logicAnd(areVdisReady, areHostsReady, arePbdsReady)

const allVdis = computed(() => {
  if (sr === undefined) {
    return []
  }

  return sr.VDIs.map(vdiRef => getVdiByOpaqueRef(vdiRef)).filter((vdi): vdi is EnrichedXenApiVdi => vdi !== undefined)
})

const vdis = computed(() => allVdis.value.filter(vdi => !vdi.is_a_snapshot))
const vdiSnapshots = computed(() => allVdis.value.filter(vdi => vdi.is_a_snapshot))

const pbds = computed(() => {
  if (sr === undefined) {
    return []
  }

  return getPbdsForSr(sr.$ref)
})

const hosts = computed(() =>
  pbds.value.map(pbd => getHostByOpaqueRef(pbd.host)).filter((host): host is XenApiHost => host !== undefined)
)

const customFields = computed(() => {
  if (sr === undefined) {
    return {}
  }

  const prefix = 'XenCenter.CustomFields.'

  return Object.entries(sr.other_config).reduce<Record<string, unknown>>((acc, [key, value]) => {
    if (key.startsWith(prefix)) {
      acc[key.slice(prefix.length)] = value
    }

    return acc
  }, {})
})
</script>
