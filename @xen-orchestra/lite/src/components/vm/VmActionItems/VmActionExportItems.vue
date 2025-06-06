<template>
  <MenuItem :icon="faFileExport">
    {{ t('export') }}
    <template #submenu>
      <VmActionExportItem :vm-refs="vmRefs" />
      <MenuItem :icon="faCode" @click="exportVmsAsJsonFile(vms, `vms_${new Date().toISOString()}.json`)">
        {{ t('export-table-to', { type: '.json' }) }}
      </MenuItem>
      <MenuItem :icon="faFileCsv" @click="exportVmsAsCsvFile(vms, `vms_${new Date().toISOString()}.csv`)">
        {{ t('export-table-to', { type: '.csv' }) }}
      </MenuItem>
    </template>
  </MenuItem>
</template>

<script lang="ts" setup>
import VmActionExportItem from '@/components/vm/VmActionItems/VmActionExportItem.vue'
import { exportVmsAsCsvFile, exportVmsAsJsonFile } from '@/libs/vm'
import type { XenApiVm } from '@/libs/xen-api/xen-api.types'
import { useVmStore } from '@/stores/xen-api/vm.store'
import MenuItem from '@core/components/menu/MenuItem.vue'
import { faCode, faFileCsv, faFileExport } from '@fortawesome/free-solid-svg-icons'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps<{
  vmRefs: XenApiVm['$ref'][]
}>()

const { t } = useI18n()

const { getByOpaqueRef: getVm } = useVmStore().subscribe()
const vms = computed(() => props.vmRefs.map(getVm).filter((vm): vm is XenApiVm => vm !== undefined))
</script>
