<template>
  <div class="new-vm-network-table">
    <VtsTable>
      <thead>
        <tr>
          <HeadCells />
        </tr>
      </thead>
      <tbody>
        <VtsRow
          v-for="row of rows"
          :id="row.fieldId"
          :key="row.item.key"
          :error="row.isInError"
          :warning="row.isWarned"
        >
          <BodyCells :item="{ vif: row.item, rank: row.rank, onRemove: () => emit('remove', row.item.key) }" />
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
    <NewVmTableMessages :rows :validation :get-label="(rank, issue) => t('new-vm:vif-issue', { n: rank, issue })" />
  </div>
</template>

<script setup lang="ts">
import type { FrontXoNetwork } from '@/modules/network/remote-resources/use-xo-network-collection.ts'
import { getNetworkIcon } from '@/modules/network/utils/xo-network.util.ts'
import { useXoPifCollection } from '@/modules/pif/remote-resources/use-xo-pif-collection.ts'
import NewVmTableMessages from '@/modules/vm/components/new/NewVmTableMessages.vue'
import { useNewVmTableRows } from '@/modules/vm/composables/use-new-vm-table-rows.composable.ts'
import type { NewVmTableValidation, NewVmVifField } from '@/modules/vm/form/new/use-new-vm-form-validation.ts'
import type { Vif, VmState } from '@/modules/vm/types/new-xo-vm.type.ts'
import VtsRow from '@core/components/table/VtsRow.vue'
import VtsTable from '@core/components/table/VtsTable.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiTableCell from '@core/components/ui/table-cell/UiTableCell.vue'
import { useFormSelect } from '@core/packages/form-select'
import { useNewVmNetworkColumns } from '@core/tables/column-sets/new-vm-network-columns.ts'
import { toRef } from 'vue'
import { useI18n } from 'vue-i18n'

const { vmState, networks, validation } = defineProps<{
  vmState: VmState
  networks: FrontXoNetwork[]
  validation: NewVmTableValidation<NewVmVifField>
}>()

const emit = defineEmits<{
  add: []
  remove: [key: Vif['key']]
}>()

const { t } = useI18n()

const { getPifsByIds } = useXoPifCollection()

const { rows, getErrorFieldId } = useNewVmTableRows(
  () => vmState.vifs,
  () => validation,
  'network'
)

const { HeadCells, BodyCells, colspan } = useNewVmNetworkColumns({
  body: (item: { vif: Vif; rank: number; onRemove: () => void }) => {
    const { vif, onRemove } = item

    const { id: interfaceSelectId } = useFormSelect(() => networks, {
      model: toRef(vif, 'network'),
      searchable: true,
      option: {
        label: 'name_label',
        value: 'id',
        properties: network => ({ icon: getNetworkIcon(getPifsByIds(network.PIFs)) }),
      },
    })

    const mac = toRef(vif, 'mac')

    return {
      rank: r => r(item.rank),
      interface: r => r(interfaceSelectId),
      mac: r => r(mac, { id: getErrorFieldId(vif.key, 'mac') }),
      remove: r => r(onRemove),
    }
  },
})
</script>

<style lang="postcss" scoped>
.new-vm-network-table {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}
</style>
