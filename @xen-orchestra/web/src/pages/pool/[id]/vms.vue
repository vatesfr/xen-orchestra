<template>
  <VtsContentSidePanel class="vms">
    <UiCard class="container">
      <VmsTable :vms :busy="!areVmsReady" :error="hasVmFetchError" />
    </UiCard>
    <VmSidePanel :vm="selectedVm" @close="selectedVm = undefined" />
  </VtsContentSidePanel>
</template>

<script lang="ts" setup>
import type { FrontXoPool } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import VmSidePanel from '@/modules/vm/components/list/panel/VmSidePanel.vue'
import VmsTable from '@/modules/vm/components/list/VmsTable.vue'
import { useXoVmCollection, type FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import VtsContentSidePanel from '@core/components/layout/VtsContentSidePanel.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import { useRouteQuery } from '@core/composables/route-query.composable.ts'
import { computed } from 'vue'

const { pool } = defineProps<{
  pool: FrontXoPool
}>()

const { areVmsReady, vmsByPool, hasVmFetchError } = useXoVmCollection()

const vms = computed(() => vmsByPool.value.get(pool.id) ?? [])

const selectedVm = useRouteQuery<FrontXoVm | undefined>('id', {
  toData: id => vms.value.find(vm => vm.id === id),
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
