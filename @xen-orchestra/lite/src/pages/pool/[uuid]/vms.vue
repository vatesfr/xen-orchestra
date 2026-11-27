<template>
  <VtsContentSidePanel class="pool-vms-view">
    <UiCard class="container">
      <VmsTable :vms :busy="!isReady" :error="hasError" />
    </UiCard>
    <template #panel>
      <VmSidePanel :vm="selectedVm" @close="selectedVm = undefined" />
    </template>
  </VtsContentSidePanel>
</template>

<script lang="ts" setup>
import type { XenApiVm } from '@/libs/xen-api/xen-api.types.ts'
import VmSidePanel from '@/modules/vm/components/list/panel/VmSidePanel.vue'
import VmsTable from '@/modules/vm/components/list/VmsTable.vue'
import { usePageTitleStore } from '@/stores/page-title.store.ts'
import { useVmStore } from '@/stores/xen-api/vm.store.ts'
import VtsContentSidePanel from '@core/components/layout/VtsContentSidePanel.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import { useRouteQuery } from '@core/composables/route-query.composable.ts'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const { records: vms, isReady, hasError } = useVmStore().subscribe()

usePageTitleStore().setTitle(() => t('vms'))

const selectedVm = useRouteQuery<XenApiVm | undefined>('id', {
  toData: id => vms.value.find(vm => vm.uuid === id),
  toQuery: vm => vm?.uuid ?? '',
})
</script>

<style lang="postcss" scoped>
.pool-vms-view {
  .container {
    height: fit-content;
    margin: 0.8rem;
    gap: 4rem;
  }
}
</style>
