<template>
  <div class="vms" :class="{ mobile: uiStore.isSmall, locked: panelStore.isLocked && !uiStore.isSmall }">
    <UiCard class="container">
      <VmsTable :vms :busy="!areVmsReady" :error="hasVmFetchError" />
    </UiCard>
    <VmSidePanel :vm="selectedVm" @close="selectedVm = undefined" />
  </div>
</template>

<script lang="ts" setup>
import type { FrontXoHost } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import VmSidePanel from '@/modules/vm/components/list/panel/VmSidePanel.vue'
import VmsTable from '@/modules/vm/components/list/VmsTable.vue'
import { useXoVmCollection, type FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import UiCard from '@core/components/ui/card/UiCard.vue'
import { useRouteQuery } from '@core/composables/route-query.composable.ts'
import { usePanelStore } from '@core/stores/panel.store'
import { useUiStore } from '@core/stores/ui.store.ts'
import { computed } from 'vue'

const { host } = defineProps<{
  host: FrontXoHost
}>()

const panelStore = usePanelStore()
const uiStore = useUiStore()

const { areVmsReady, vmsByHost, hasVmFetchError } = useXoVmCollection()

const vms = computed(() => vmsByHost.value.get(host.id) ?? [])

const selectedVm = useRouteQuery<FrontXoVm | undefined>('id', {
  toData: id => vms.value.find(vm => vm.id === id),
  toQuery: vm => vm?.id ?? '',
})
</script>

<style scoped lang="postcss">
.vms {
  &.locked:not(.mobile) {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 40rem;
  }

  .container {
    height: fit-content;
    gap: 4rem;
    margin: 0.8rem;
  }
}
</style>
