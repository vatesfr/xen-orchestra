<template>
  <VtsStateHero v-if="!areVdisReady" format="page" type="busy" size="large" />
  <VtsStateHero v-else-if="!vdi" format="page" type="not-found" size="large">
    {{ t('object-not-found', { id: route.params.id }) }}
  </VtsStateHero>
  <div v-else>
    <VdiHeader v-if="uiStore.hasUi" :vdi :vm :vbd :sr :from-context="fromContext" />
    <div class="card-grid" :class="{ mobile: uiStore.isSmall }">
      <VdiDetailGeneralInfo :vdi :vbd />
      <VdiDetailConfiguration :vdi />
      <VdiDetailSpace :vdi />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useXoSrCollection } from '@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'
import { useXoVbdCollection } from '@/modules/vbd/remote-resources/use-xo-vbd-collection.ts'
import VdiDetailConfiguration from '@/modules/vdi/components/detail/VdiDetailConfiguration.vue'
import VdiDetailGeneralInfo from '@/modules/vdi/components/detail/VdiDetailGeneralInfo.vue'
import VdiDetailSpace from '@/modules/vdi/components/detail/VdiDetailSpace.vue'
import VdiHeader from '@/modules/vdi/components/VdiHeader.vue'
import type { FrontXoVdi } from '@/modules/vdi/remote-resources/use-xo-vdi-collection.ts'
import { useXoVdiCollection } from '@/modules/vdi/remote-resources/use-xo-vdi-collection.ts'
import { useXoVmCollection } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { type VdiPageContext } from '@/shared/constants.ts'
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

const fromContext = computed(() => route.query.from as VdiPageContext | undefined)

const vdi = useGetVdiById(() => route.params.id as FrontXoVdi['id'])

const vbds = useGetVbdsByIds(() => vdi.value?.$VBDs ?? [])
const vbd = computed(() => vbds.value.find(vbd => vbd.attached) ?? vbds.value[0])

const { useGetVmById } = useXoVmCollection()
const vm = useGetVmById(() => vbd.value?.VM as XoVm['id'])

const { useGetSrById } = useXoSrCollection()
const sr = useGetSrById(() => vdi.value?.$SR)
</script>

<style scoped lang="postcss">
.card-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  grid-template-areas:
    'general config'
    'space config';
  align-items: start;
  gap: 1.6rem;
  padding: 1.6rem;

  &.mobile {
    grid-template-columns: 1fr;
    grid-template-areas:
      'general'
      'config'
      'space';
  }
}
</style>
