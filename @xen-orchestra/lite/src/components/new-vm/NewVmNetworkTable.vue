<template>
  <VtsTable>
    <thead>
      <tr>
        <HeadCells />
      </tr>
    </thead>
    <tbody>
      <VtsRow v-for="(networkInterface, index) in vmState.networkInterfaces" :key="index">
        <BodyCells :item="{ networkInterface, onRemove: () => emit('remove', index) }" />
      </VtsRow>
      <tr>
        <UiTableCell :colspan>
          <UiButton left-icon="fa:plus" variant="tertiary" accent="brand" size="medium" @click="emit('add')">
            {{ t('new') }}
          </UiButton>
        </UiTableCell>
      </tr>
    </tbody>
  </VtsTable>
</template>

<script setup lang="ts">
import type { XenApiNetwork } from '@/libs/xen-api/xen-api.types'
import type { NetworkInterface, VmState } from '@/types/new-vm'
import VtsRow from '@core/components/table/VtsRow.vue'
import VtsTable from '@core/components/table/VtsTable.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiTableCell from '@core/components/ui/table-cell/UiTableCell.vue'
import { useFormSelect } from '@core/packages/form-select'
import { useNewVmNetworkColumns } from '@core/tables/column-sets/new-vm-network-columns'
import { toRef } from 'vue'
import { useI18n } from 'vue-i18n'

const { networks } = defineProps<{
  vmState: VmState
  networks: XenApiNetwork[]
}>()

const emit = defineEmits<{
  add: []
  remove: [index: number]
}>()

const { t } = useI18n()

const { HeadCells, BodyCells, colspan } = useNewVmNetworkColumns({
  body: ({ networkInterface, onRemove }: { networkInterface: NetworkInterface; onRemove: () => void }) => {
    const { id: interfaceSelectId } = useFormSelect(networks, {
      model: toRef(networkInterface, 'interface'),
      option: {
        id: '$ref',
        label: 'name_label',
        value: '$ref',
      },
    })

    const mac = toRef(networkInterface, 'macAddress')

    return {
      interface: r => r(interfaceSelectId),
      mac: r => r(mac),
      remove: r => r(onRemove),
    }
  },
})
</script>
