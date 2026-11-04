<template>
  <UiCard>
    <UiCardTitle>
      {{ t('per-vm-options') }}
      <template #description>{{ t('v2v:per-vm-options-info') }}</template>
    </UiCardTitle>
    <VtsTable>
      <thead>
        <tr>
          <HeadCells />
        </tr>
      </thead>
      <tbody>
        <VtsRow v-for="row of rows" :key="row.id">
          <BodyCells :item="row" />
        </VtsRow>
      </tbody>
    </VtsTable>
  </UiCard>
</template>

<script lang="ts" setup>
import V2vLaunchOptionSelect from '@/modules/v2v/components/review/V2vLaunchOptionSelect.vue'
import type {
  V2vLaunchSettings,
  V2vVmLaunchOption,
  V2vVmLaunchOptionsRow,
} from '@/modules/v2v/types/v2v-launch.type.ts'
import VtsRow from '@core/components/table/VtsRow.vue'
import VtsTable from '@core/components/table/VtsTable.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import { defineColumns } from '@core/packages/table/define-columns.ts'
import { useTextColumn } from '@core/tables/column-definitions/text-column.ts'
import { renderBodyCell } from '@core/tables/helpers/render-body-cell.ts'
import { h } from 'vue'
import { useI18n } from 'vue-i18n'

const { defaults } = defineProps<{
  rows: V2vVmLaunchOptionsRow[]
  defaults: Pick<V2vLaunchSettings, V2vVmLaunchOption>
}>()

const emit = defineEmits<{
  changeOption: [vmId: V2vVmLaunchOptionsRow['id'], option: V2vVmLaunchOption, value: boolean | undefined]
}>()

const { t } = useI18n()

const useVmLaunchOptionsColumns = defineColumns(() => ({
  vm: useTextColumn({ headerLabel: () => t('vm') }),
  stopSource: useTextColumn({ headerLabel: () => t('v2v:stop-source') }),
  repair: useTextColumn({ headerLabel: () => t('v2v:repair') }),
  startVm: useTextColumn({ headerLabel: () => t('v2v:start-on-xcp-ng') }),
}))

const renderOptionSelect = (row: V2vVmLaunchOptionsRow, option: V2vVmLaunchOption) =>
  renderBodyCell(() =>
    h(V2vLaunchOptionSelect, {
      modelValue: row.overrides?.[option],
      defaultValue: defaults[option],
      'onUpdate:modelValue': value => emit('changeOption', row.id, option, value),
    })
  )

const { HeadCells, BodyCells } = useVmLaunchOptionsColumns({
  body: (row: V2vVmLaunchOptionsRow) => ({
    vm: renderer => renderer(row.name),
    stopSource: () => renderOptionSelect(row, 'stopSource'),
    repair: () => renderOptionSelect(row, 'repair'),
    startVm: () => renderOptionSelect(row, 'startVm'),
  }),
})
</script>
