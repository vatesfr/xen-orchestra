<template>
  <div v-if="vdi && vm && attachedVdb">
    <VdiHeader v-if="uiStore.hasUi" :vdi :vm :vbd="attachedVdb" />
  </div>
  <div v-if="vdi && attachedVdb" class="card-grid" :class="{ mobile: uiStore.isSmall }">
    <VdiDetailGeneralInfo :vdi :vbd="attachedVdb" />
    <VdiDetailConfiguration :vdi />
    <VdiDetailSpace :vdi />
  </div>
</template>

<script setup lang="ts">
import { useXoVbdCollection } from '@/modules/vbd/remote-resources/use-xo-vbd-collection.ts'
import VdiDetailConfiguration from '@/modules/vdi/components/detail/VdiDetailConfiguration.vue'
import VdiDetailGeneralInfo from '@/modules/vdi/components/detail/VdiDetailGeneralInfo.vue'
import VdiDetailSpace from '@/modules/vdi/components/detail/VdiDetailSpace.vue'
import VdiHeader from '@/modules/vdi/components/VdiHeader.vue'
import type { FrontXoVdi } from '@/modules/vdi/remote-resources/use-xo-vdi-collection.ts'
import { useXoVdiCollection } from '@/modules/vdi/remote-resources/use-xo-vdi-collection.ts'
import { useXoVmCollection } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { useUiStore } from '@core/stores/ui.store.ts'
import type { XoVm } from '@vates/types'
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute<'/vdi/[id]'>()
const uiStore = useUiStore()

const { useGetVdiById } = useXoVdiCollection()
const vdi = useGetVdiById(() => route.params.id as FrontXoVdi['id'])

const { useGetVbdsByIds } = useXoVbdCollection()
const vbds = useGetVbdsByIds(() => vdi.value?.$VBDs ?? [])

const attachedVdb = computed(() => vbds.value.find(vbd => vbd.attached))

const { useGetVmById } = useXoVmCollection()
const vm = useGetVmById(() => attachedVdb.value?.VM as XoVm['id'])
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
