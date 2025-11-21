<template>
  <div class="vdis" :class="{ mobile: uiStore.isMobile }">
    <UiCard class="container">
      <VmVdisTable :vdis="filteredVdisByCd" :has-error="hasVmVdiFetchError" :is-ready="areVmVdisReady" />
    </UiCard>
    <VmVdiSidePanel v-if="selectedVdi" :vdi="selectedVdi" :vm @close="selectedVdi = undefined" />
    <UiPanel v-else-if="!uiStore.isMobile">
      <VtsStateHero format="panel" type="no-selection" size="medium">
        {{ t('select-to-see-details') }}
      </VtsStateHero>
    </UiPanel>
  </div>
</template>

<script setup lang="ts">
import VmVdiSidePanel from '@/components/vdis/panel/VmVdiSidePanel.vue'
import VmVdisTable from '@/components/vdis/VmVdisTable.vue'
import { useXoVbdCollection } from '@/remote-resources/use-xo-vbd-collection.ts'
import { useXoVmVdisCollection } from '@/remote-resources/use-xo-vm-vdis-collection.ts'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiPanel from '@core/components/ui/panel/UiPanel.vue'
import { useRouteQuery } from '@core/composables/route-query.composable.ts'
import { useUiStore } from '@core/stores/ui.store.ts'
import type { XoVdi, XoVm } from '@vates/types'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { vm } = defineProps<{
  vm: XoVm
}>()

const { t } = useI18n()

const { vbds } = useXoVbdCollection()
const { vmVdis: vdis, getVmVdiById, hasVmVdiFetchError, areVmVdisReady } = useXoVmVdisCollection({}, () => vm.id)
const uiStore = useUiStore()

const filteredVdisByCd = computed(() => {
  return vdis.value.filter(vdi => {
    const vdiVbds = vbds.value.filter(vbd => vdi.$VBDs.includes(vbd.id) && !vbd.is_cd_drive)

    return vdiVbds.some(vbd => !vbd.is_cd_drive)
  })
})

const selectedVdi = useRouteQuery<XoVdi | undefined>('id', {
  toData: id => getVmVdiById(id as XoVdi['id']),
  toQuery: vdi => vdi?.id ?? '',
})
</script>

<style scoped lang="postcss">
.vdis {
  &:not(.mobile) {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 40rem;
  }

  .container {
    height: fit-content;
    margin: 0.8rem;
    gap: 4rem;
  }
}
</style>
