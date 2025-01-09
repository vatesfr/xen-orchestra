<template>
  <li>
    <VtsMenuTrigger :icon="faFileExport" v-bind="toggle.$trigger">
      {{ $t('export') }}
    </VtsMenuTrigger>

    <VtsMenuList v-bind="toggle.$target">
      <VmActionExportItem :menu="toggle" :vm-refs="vmRefs" />
      <VtsMenuItem :icon="faCode" v-bind="toggle.exportAsJson">
        {{ $t('export-table-to', { type: '.json' }) }}
      </VtsMenuItem>
      <VtsMenuItem :icon="faFileCsv" v-bind="toggle.exportAsCsv">
        {{ $t('export-table-to', { type: '.csv' }) }}
      </VtsMenuItem>
    </VtsMenuList>
  </li>
</template>

<script lang="ts" setup>
import VmActionExportItem from '@/components/vm/VmActionItems/VmActionExportItem.vue'
import { exportVmsAsCsvFile, exportVmsAsJsonFile } from '@/libs/vm'
import type { XenApiVm } from '@/libs/xen-api/xen-api.types'
import { useVmStore } from '@/stores/xen-api/vm.store'
import VtsMenuItem from '@core/components/menu/VtsMenuItem.vue'
import VtsMenuList from '@core/components/menu/VtsMenuList.vue'
import VtsMenuTrigger from '@core/components/menu/VtsMenuTrigger.vue'
import { action, type MenuLike, useMenuToggle } from '@core/packages/menu'
import { faCode, faFileCsv, faFileExport } from '@fortawesome/free-solid-svg-icons'
import { computed } from 'vue'

const props = defineProps<{
  menu: MenuLike
  vmRefs: XenApiVm['$ref'][]
}>()

const { getByOpaqueRef: getVm } = useVmStore().subscribe()
const vms = computed(() => props.vmRefs.map(getVm).filter((vm): vm is XenApiVm => vm !== undefined))

const toggle = useMenuToggle({
  parent: props.menu,
  items: {
    exportAsJson: action(() => exportVmsAsJsonFile(vms.value, `vms_${new Date().toISOString()}.json`)),
    exportAsCsv: action(() => exportVmsAsCsvFile(vms.value, `vms_${new Date().toISOString()}.csv`)),
  },
})
</script>
