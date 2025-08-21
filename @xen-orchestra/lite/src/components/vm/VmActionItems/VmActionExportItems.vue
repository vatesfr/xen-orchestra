<template>
  <MenuItem icon="fa:file-export">
    {{ t('export') }}
    <template #submenu>
      <VmActionExportItem :vm-refs="vmRefs" />
      <MenuItem icon="fa:code" @click="exportVmsAsJsonFile(vms, `vms_${new Date().toISOString()}.json`)">
        {{ t('export-table-to', { type: '.json' }) }}
      </MenuItem>
      <MenuItem icon="fa:file-csv" @click="exportVmsAsCsvFile(vms, `vms_${new Date().toISOString()}.csv`)">
        {{ t('export-table-to', { type: '.csv' }) }}
      </MenuItem>
    </template>
  </MenuItem>
</template>

<script lang="ts" setup>
import VmActionExportItem from '@/components/vm/VmActionItems/VmActionExportItem.vue'
import { exportVmsAsCsvFile, exportVmsAsJsonFile } from '@/libs/vm'
import { useVmStore } from '@/stores/xen-api/vm.store'
import MenuItem from '@core/components/menu/MenuItem.vue'
import type { XenApiVm } from '@vates/types'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps<{
  vmRefs: XenApiVm['$ref'][]
}>()

const { t } = useI18n()

const { getByOpaqueRef: getVm } = useVmStore().subscribe()
const vms = computed(() => props.vmRefs.map(getVm).filter((vm): vm is XenApiVm => vm !== undefined))
</script>
