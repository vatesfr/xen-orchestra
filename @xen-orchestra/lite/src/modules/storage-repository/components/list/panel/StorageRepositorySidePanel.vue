<template>
  <VtsSidePanel :key="panelSignature" :has-selection="!!sr" @close="emit('close')">
    <template v-if="sr" #actions>
      <SrConnectButton :scope :sr />
      <MenuList placement="bottom-end">
        <template #trigger="{ open }">
          <UiButtonIcon accent="brand" icon="action:more-actions" size="medium" @click="open($event)" />
        </template>
        <SrDisconnectButton :scope :sr />
        <SrDeleteButton :sr />
      </MenuList>
    </template>
    <template v-if="sr" #default>
      <VtsStateHero v-if="!isReady" format="panel" type="busy" size="medium" />
      <template v-else>
        <StorageRepositoryInfosCard :pool :scope :sr />
        <StorageRepositorySpaceCard :sr />
        <StorageRepositoryVdisCard :vdis :vdi-snapshots />
        <StorageRepositoryHostsCard :hosts />
        <StorageRepositoryPbdsCard :scope :sr />
        <StorageRepositoryCustomFieldsCard :custom-fields />
      </template>
    </template>
  </VtsSidePanel>
</template>

<script setup lang="ts">
import type { XenApiHost, XenApiPool, XenApiSr, XenApiVdi } from '@/libs/xen-api/xen-api.types.ts'
import SrConnectButton from '@/modules/storage-repository/components/actions/connect/SrConnectButton.vue'
import SrDeleteButton from '@/modules/storage-repository/components/actions/delete/SrDeleteButton.vue'
import SrDisconnectButton from '@/modules/storage-repository/components/actions/disconnect/SrDisconnectButton.vue'
import StorageRepositoryCustomFieldsCard from '@/modules/storage-repository/components/list/panel/cards/StorageRepositoryCustomFieldsCard.vue'
import StorageRepositoryHostsCard from '@/modules/storage-repository/components/list/panel/cards/StorageRepositoryHostsCard.vue'
import StorageRepositoryInfosCard from '@/modules/storage-repository/components/list/panel/cards/StorageRepositoryInfosCard.vue'
import StorageRepositoryPbdsCard from '@/modules/storage-repository/components/list/panel/cards/StorageRepositoryPbdsCard.vue'
import StorageRepositorySpaceCard from '@/modules/storage-repository/components/list/panel/cards/StorageRepositorySpaceCard.vue'
import StorageRepositoryVdisCard from '@/modules/storage-repository/components/list/panel/cards/StorageRepositoryVdisCard.vue'
import { useGetPbdsInScope } from '@/modules/storage-repository/composables/sr-utils.composable.ts'
import { useHostStore } from '@/stores/xen-api/host.store.ts'
import { usePbdStore } from '@/stores/xen-api/pbd.store.ts'
import { useVdiStore } from '@/stores/xen-api/vdi.store.ts'
import type { SrScope } from '@core/types/storage-repository.type.ts'
import MenuList from '@core/components/menu/MenuList.vue'
import VtsSidePanel from '@core/components/panel/VtsSidePanel.vue'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import UiButtonIcon from '@core/components/ui/button-icon/UiButtonIcon.vue'
import { logicAnd } from '@vueuse/math'
import { computed } from 'vue'

const { sr, pool, scope } = defineProps<{
  sr?: XenApiSr
  pool: XenApiPool
  scope: SrScope
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

  return sr.VDIs.map(vdiRef => getVdiByOpaqueRef(vdiRef)).filter((vdi): vdi is XenApiVdi => vdi !== undefined)
})

const vdis = computed(() => allVdis.value.filter(vdi => !vdi.is_a_snapshot))
const vdiSnapshots = computed(() => allVdis.value.filter(vdi => vdi.is_a_snapshot))

const pbds = computed(() => {
  if (sr === undefined) {
    return []
  }

  return getPbdsForSr(sr.$ref)
})
const { getSrPbdsSignature } = useGetPbdsInScope()

const panelSignature = computed(() => getSrPbdsSignature(sr, scope))

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
