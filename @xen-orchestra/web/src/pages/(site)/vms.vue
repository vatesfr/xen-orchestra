<template>
  <VtsContentSidePanel class="vms">
    <UiCard class="container">
      <VmsTable :vms :busy="!areVmsReady" :error="hasVmFetchError" />
    </UiCard>
    <VmSidePanel :vm="selectedVm" @close="selectedVm = undefined" />
  </VtsContentSidePanel>
</template>

<script setup lang="ts">
import VmSidePanel from '@/modules/vm/components/list/panel/VmSidePanel.vue'
import VmsTable from '@/modules/vm/components/list/VmsTable.vue'
import { useXoVmCollection, type FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import VtsContentSidePanel from '@core/components/layout/VtsContentSidePanel.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import { useRouteQuery } from '@core/composables/route-query.composable'

const { vms, getVmById, areVmsReady, hasVmFetchError } = useXoVmCollection()

const selectedVm = useRouteQuery<FrontXoVm | undefined>('id', {
  toData: id => getVmById(id as FrontXoVm['id']),
  toQuery: vm => vm?.id ?? '',
})
</script>

<style scoped lang="postcss">
.vms {
  .container {
    height: fit-content;
    gap: 4rem;
    margin: 0.8rem;
  }
}
</style>
