<template>
  <VtsSidePanel :key="panelSignature" :selected="!!sr" :closable="!!sr" @close="emit('close')">
    <template v-if="sr" #actions>
      <VtsDeleteButton
        class="sr-delete-button"
        :disabled="!canDeleteSr"
        :busy="isDeletingSr"
        @click="openSrDeleteModal()"
      />
      <SrDisconnectButton class="sr-disconnect-button" :sr :scope />
    </template>
    <template #default>
      <VtsStateHero v-if="!sr" format="panel" type="no-selection" size="medium" />
      <VtsStateHero v-else-if="!isReady" format="panel" type="busy" size="medium" />
      <template v-else>
        <StorageRepositoryInfosCard :sr :scope />
        <StorageRepositorySpaceCard :sr />
        <StorageRepositoryVdisCard :vdis />
        <StorageRepositoryHostsCard :hosts />
        <StorageRepositoryPbdsCard :sr :scope />
        <StorageRepositoryCustomFieldsCard :custom-fields />
      </template>
    </template>
  </VtsSidePanel>
</template>

<script setup lang="ts">
import { useXoHostCollection, type FrontXoHost } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import { useXoPbdCollection } from '@/modules/pbd/remote-resources/use-xo-pbd-collection.ts'
import SrDisconnectButton from '@/modules/storage-repository/components/actions/disconnect/SrDisconnectButton.vue'
import StorageRepositoryCustomFieldsCard from '@/modules/storage-repository/components/list/panel/cards/StorageRepositoryCustomFieldsCard.vue'
import StorageRepositoryHostsCard from '@/modules/storage-repository/components/list/panel/cards/StorageRepositoryHostsCard.vue'
import StorageRepositoryInfosCard from '@/modules/storage-repository/components/list/panel/cards/StorageRepositoryInfosCard.vue'
import StorageRepositoryPbdsCard from '@/modules/storage-repository/components/list/panel/cards/StorageRepositoryPbdsCard.vue'
import StorageRepositorySpaceCard from '@/modules/storage-repository/components/list/panel/cards/StorageRepositorySpaceCard.vue'
import StorageRepositoryVdisCard from '@/modules/storage-repository/components/list/panel/cards/StorageRepositoryVdisCard.vue'
import { useSrDeleteModal } from '@/modules/storage-repository/composables/use-sr-delete-modal.composable.ts'
import { useGetPbdsInScope } from '@/modules/storage-repository/composables/xo-sr-utils.composable.ts'
import type { FrontXoSr } from '@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'
import type { StorageScope } from '@/modules/storage-repository/types/storage-scope.type.ts'
import { useXoVdiCollection } from '@/modules/vdi/remote-resources/use-xo-vdi-collection.ts'
import VtsDeleteButton from '@core/components/delete-button/VtsDeleteButton.vue'
import VtsSidePanel from '@core/components/panel/VtsSidePanel.vue'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import type { XoVdi } from '@vates/types'
import { logicAnd } from '@vueuse/math'
import { computed } from 'vue'

const { sr, scope } = defineProps<{
  sr?: FrontXoSr
  scope: StorageScope
}>()

const emit = defineEmits<{
  close: []
}>()

const { useGetVdisByIds, areVdisReady } = useXoVdiCollection()
const { getHostById, areHostsReady } = useXoHostCollection()
const { pbdsBySr, arePbdsReady } = useXoPbdCollection()

const isReady = logicAnd(areVdisReady, areHostsReady, arePbdsReady)

const vdis = useGetVdisByIds(() => (sr?.VDIs ?? []) as XoVdi['id'][])

const { getSrPbdsSignature } = useGetPbdsInScope()

const panelSignature = computed(() => getSrPbdsSignature(sr, scope))

const pbds = computed(() => (sr !== undefined ? pbdsBySr.value.get(sr.id) : undefined) ?? [])

const hosts = computed(() =>
  pbds.value.reduce<FrontXoHost[]>((acc, pbd) => {
    const host = getHostById(pbd.host)

    if (host !== undefined) {
      acc.push(host)
    }

    return acc
  }, [])
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

const {
  openModal: openSrDeleteModal,
  canRun: canDeleteSr,
  isRunning: isDeletingSr,
} = useSrDeleteModal(() => (sr !== undefined ? [sr] : []))
</script>
