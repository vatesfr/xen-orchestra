<template>
  <div class="vdis" :class="{ mobile: uiStore.isMobile }">
    <UiCard class="container">
      <VdisTable :vdis="filteredVdisByNotCdVbd" :busy="!areVmVdisReady" :error="hasVmVdiFetchError" />
    </UiCard>
    <VdiSidePanel v-if="selectedVdi" :vdi="selectedVdi" :vm @close="selectedVdi = undefined" />
    <UiPanel v-else-if="!uiStore.isMobile">
      <VtsStateHero format="panel" type="no-selection" size="medium">
        {{ t('select-to-see-details') }}
      </VtsStateHero>
    </UiPanel>
  </div>
</template>

<script setup lang="ts">
import VdiSidePanel from '@/modules/vdi/components/list/panel/VdiSidePanel.vue'
import VdisTable from '@/modules/vdi/components/list/VdisTable.vue'
import type { FrontXoVdi } from '@/modules/vdi/remote-resources/use-xo-vdi-collection.ts'
import { useXoVmVbdsUtils } from '@/modules/vm/composables/xo-vm-vbd-utils.composable.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { useXoVmVdisCollection } from '@/modules/vm/remote-resources/use-xo-vm-vdis-collection.ts'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiPanel from '@core/components/ui/panel/UiPanel.vue'
import { useRouteQuery } from '@core/composables/route-query.composable.ts'
import { useUiStore } from '@core/stores/ui.store.ts'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { vm } = defineProps<{
  vm: FrontXoVm
}>()

const { t } = useI18n()

const { vmVdis, getVmVdiById, hasVmVdiFetchError, areVmVdisReady } = useXoVmVdisCollection({}, () => vm.id)
const uiStore = useUiStore()

const { notCdDriveVbds } = useXoVmVbdsUtils(() => vm)

const filteredVdisByNotCdVbd = computed(() =>
  vmVdis.value.filter(vdi => notCdDriveVbds.value.some(vbd => vdi.$VBDs.includes(vbd.id)))
)

const selectedVdi = useRouteQuery<FrontXoVdi | undefined>('id', {
  toData: id => getVmVdiById(id as FrontXoVdi['id']),
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
