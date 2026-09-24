<template>
  <VtsContentSidePanel class="vdis">
    <UiCard class="container">
      <VdisTable :vdis :busy="!areVdisReady" :error="hasVdiFetchError" />
    </UiCard>
    <VdiSidePanel :vdi="selectedVdi" @close="selectedVdi = undefined" />
  </VtsContentSidePanel>
</template>

<script lang="ts" setup>
import type { FrontXoSr } from '@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'
import VdiSidePanel from '@/modules/vdi/components/list/panel/VdiSidePanel.vue'
import VdisTable from '@/modules/vdi/components/list/VdisTable.vue'
import { type FrontXoVdi, useXoVdiCollection } from '@/modules/vdi/remote-resources/use-xo-vdi-collection.ts'
import VtsContentSidePanel from '@core/components/layout/VtsContentSidePanel.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import { useRouteQuery } from '@core/composables/route-query.composable.ts'

const { sr } = defineProps<{
  sr: FrontXoSr
}>()

const { useGetVdisByIds, areVdisReady, hasVdiFetchError } = useXoVdiCollection()

// sr.VDIs also contains VDI snapshot ids, which the VDI collection doesn't resolve
const vdis = useGetVdisByIds(() => sr.VDIs as FrontXoVdi['id'][])

const selectedVdi = useRouteQuery<FrontXoVdi | undefined>('id', {
  toData: id => vdis.value.find(vdi => vdi.id === id),
  toQuery: vdi => vdi?.id ?? '',
})
</script>

<style scoped lang="postcss">
.vdis {
  .container {
    height: fit-content;
    gap: 4rem;
    margin: 0.8rem;
  }
}
</style>
