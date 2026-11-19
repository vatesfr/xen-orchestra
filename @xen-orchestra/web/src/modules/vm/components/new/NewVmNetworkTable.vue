<template>
  <VtsTable>
    <thead>
      <tr>
        <HeadCells />
      </tr>
    </thead>
    <tbody>
      <VtsRow v-for="(vif, index) in vmState.vifs" :key="vif.key">
        <BodyCells :item="{ vif, rank: index + 1, onRemove: () => emit('remove', vif.key) }" />
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
import type { FrontXoNetwork } from '@/modules/network/remote-resources/use-xo-network-collection.ts'
import type { Vif, VmState } from '@/modules/vm/types/new-xo-vm.type.ts'
import VtsRow from '@core/components/table/VtsRow.vue'
import VtsTable from '@core/components/table/VtsTable.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiTableCell from '@core/components/ui/table-cell/UiTableCell.vue'
import { useFormSelect } from '@core/packages/form-select'
import { useNewVmNetworkColumns } from '@core/tables/column-sets/new-vm-network-columns.ts'
import { toRef } from 'vue'
import { useI18n } from 'vue-i18n'

const { networks } = defineProps<{
  vmState: VmState
  networks: FrontXoNetwork[]
}>()

const emit = defineEmits<{
  add: []
  remove: [key: Vif['key']]
}>()

const { t } = useI18n()

const { HeadCells, BodyCells, colspan } = useNewVmNetworkColumns({
  body: (item: { vif: Vif; rank: number; onRemove: () => void }) => {
    const { vif, onRemove } = item

    const { id: interfaceSelectId } = useFormSelect(() => networks, {
      model: toRef(vif, 'network'),
      option: {
        label: 'name_label',
        value: 'id',
      },
    })

    const mac = toRef(vif, 'mac')

    return {
      rank: r => r(item.rank),
      interface: r => r(interfaceSelectId),
      mac: r => r(mac),
      remove: r => r(onRemove),
    }
  },
})
</script>
