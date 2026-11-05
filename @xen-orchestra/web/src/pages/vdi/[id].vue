<template>
  <VtsStateHero v-if="!areVdisReady || !areVdiSnapshotsReady" format="page" type="busy" size="large" />
  <VtsStateHero v-else-if="!vdi && !vdiSnapshot" format="page" type="not-found" size="large">
    {{ t('object-not-found', { id: route.params.id }) }}
  </VtsStateHero>
  <RouterView v-else v-slot="{ Component }">
    <VdiHeader v-if="uiStore.hasUi" :vdi :vm :vbds :vbd :sr :vdi-snapshot :from-context="fromContext" />
    <component :is="Component" :vdi :vbd :vm :sr :vdi-snapshot />
  </RouterView>
</template>

<script lang="ts" setup>
import { useXoSrCollection } from '@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'
import { useXoVbdCollection } from '@/modules/vbd/remote-resources/use-xo-vbd-collection.ts'
import VdiHeader from '@/modules/vdi/components/VdiHeader.vue'
import { type FrontXoVdi, useXoVdiCollection } from '@/modules/vdi/remote-resources/use-xo-vdi-collection.ts'
import {
  type FrontXoVdiSnapshot,
  useXoVdiSnapshotCollection,
} from '@/modules/vdi/remote-resources/use-xo-vdi-snapshot-collection.ts'
import { useXoVmCollection } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { VDI_PAGE_CONTEXT, type VdiPageContext } from '@/shared/constants.ts'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import { useUiStore } from '@core/stores/ui.store.ts'
import type { XoVm } from '@vates/types'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'

const route = useRoute<'/vdi/[id]'>()
const uiStore = useUiStore()
const { t } = useI18n()

const { useGetVdiById, areVdisReady } = useXoVdiCollection()
const { useGetVbdsByIds } = useXoVbdCollection()
const { useGetVmById } = useXoVmCollection()
const { useGetSrById } = useXoSrCollection()
const { useGetVdiSnapshotById, areVdiSnapshotsReady } = useXoVdiSnapshotCollection()

const vdi = useGetVdiById(() => route.params.id as FrontXoVdi['id'])

const vdiSnapshot = useGetVdiSnapshotById(() => route.params.id as FrontXoVdiSnapshot['id'])

const vbds = useGetVbdsByIds(() => vdi.value?.$VBDs ?? [])

const vbd = computed(() => vbds.value.find(vbd => vbd.attached) ?? vbds.value[0])

const vm = useGetVmById(() => vbd.value?.VM as XoVm['id'])

const sr = useGetSrById(() => vdi.value?.$SR)

const fromContext = computed(() => {
  if (route.query.from) {
    return route.query.from as VdiPageContext
  } else if (vdiSnapshot.value) {
    return VDI_PAGE_CONTEXT.VDI_SNAPSHOT
  } else if (vbd.value?.attached && vm.value) {
    return VDI_PAGE_CONTEXT.VM
  } else {
    return VDI_PAGE_CONTEXT.SR
  }
})
</script>
