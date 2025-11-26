<template>
  <VtsTableNew>
    <thead>
      <tr>
        <HeadCells />
      </tr>
    </thead>
    <tbody>
      <VtsRow v-for="(vif, index) in vmState.vifs" :key="vif.id ?? index">
        <BodyCells :item="{ vif, onRemove: () => emit('remove', index) }" />
      </VtsRow>
      <tr>
        <UiTableCell :colspan>
          <UiButton left-icon="fa:plus" variant="tertiary" accent="brand" size="medium" @click="emit('add')">
            {{ t('new') }}
          </UiButton>
        </UiTableCell>
      </tr>
    </tbody>
  </VtsTableNew>
</template>

<script setup lang="ts">
import type { Vif, VmState } from '@/types/xo/new-vm.type'
import VtsRow from '@core/components/table/VtsRow.vue'
import VtsTableNew from '@core/components/table/VtsTableNew.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiTableCell from '@core/components/ui/table-cell/UiTableCell.vue'
import { useFormSelect } from '@core/packages/form-select'
import { defineColumns } from '@core/packages/table/define-columns'
import { useButtonIconColumn } from '@core/tables/column-definitions/button-icon-column'
import { useInputColumn } from '@core/tables/column-definitions/input-column'
import { useSelectColumn } from '@core/tables/column-definitions/select-column'
import { renderBodyCell } from '@core/tables/helpers/render-body-cell'
import type { XoNetwork } from '@vates/types'
import { toRef } from 'vue'
import { useI18n } from 'vue-i18n'

const { networks } = defineProps<{
  vmState: VmState
  networks: XoNetwork[]
}>()

const emit = defineEmits<{
  add: []
  remove: [index: number]
}>()

const { t } = useI18n()

const useNewVmNetworkColumns = defineColumns(() => ({
  interface: useSelectColumn({
    headerLabel: () => t('interfaces'),
    headerIcon: 'fa:network-wired',
  }),
  mac: useInputColumn({
    headerLabel: () => t('mac-addresses'),
    headerIcon: 'fa:at',
    placeholder: () => t('auto-generated'),
  }),
  remove: useButtonIconColumn({ buttonIcon: 'fa:trash' }),
}))

const { HeadCells, BodyCells, colspan } = useNewVmNetworkColumns({
  body: ({ vif, onRemove }: { vif: Vif; onRemove: () => void }) => {
    const { id: interfaceSelectId } = useFormSelect(networks, {
      model: toRef(vif, 'network'),
      option: {
        label: 'name_label',
        value: 'id',
      },
    })

    return {
      interface: r => r(interfaceSelectId),
      mac: r => r(toRef(vif, 'mac')),
      remove: r => (onRemove ? r(onRemove) : renderBodyCell()),
    }
  },
})
</script>
