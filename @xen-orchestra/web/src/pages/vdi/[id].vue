<template>
  <VtsStateHero v-if="!areVdisReady" format="page" type="busy" size="large" />
  <VtsStateHero v-else-if="!vdi" format="page" type="not-found" size="large">
    {{ t('object-not-found', { id: route.params.id }) }}
  </VtsStateHero>
  <RouterView v-else v-slot="{ Component }">
    <VdiHeader v-if="uiStore.hasUi" :vdi :vm :vbd :sr :from-context="fromContext" />
    <component :is="Component" :vdi :vbd :vm :sr />
  </RouterView>
</template>

<script lang="ts" setup>
import { useXoSrCollection } from '@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'
import { useXoVbdCollection } from '@/modules/vbd/remote-resources/use-xo-vbd-collection.ts'
import VdiHeader from '@/modules/vdi/components/VdiHeader.vue'
import { type FrontXoVdi, useXoVdiCollection } from '@/modules/vdi/remote-resources/use-xo-vdi-collection.ts'
import { useXoVmCollection } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import type { VdiPageContext } from '@/shared/constants.ts'
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

const fromContext = computed(() => route.query.from as VdiPageContext | undefined)

const vdi = useGetVdiById(() => route.params.id as FrontXoVdi['id'])

const vbds = useGetVbdsByIds(() => vdi.value?.$VBDs ?? [])

const vbd = computed(() => vbds.value.find(vbd => vbd.attached) ?? vbds.value[0])

const vm = useGetVmById(() => vbd.value?.VM as XoVm['id'])

const sr = useGetSrById(() => vdi.value?.$SR)
</script>
