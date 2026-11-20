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
  V2vVmLaunchOption,
  V2vVmLaunchOptions,
  V2vVmLaunchOptionsRow,
} from '@/modules/v2v/types/v2v-launch.type.ts'
import VtsRow from '@core/components/table/VtsRow.vue'
import VtsTable from '@core/components/table/VtsTable.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import { useV2vVmLaunchOptionsColumns } from '@core/tables/column-sets/v2v-vm-launch-options-columns.ts'
import { renderBodyCell } from '@core/tables/helpers/render-body-cell.ts'
import { h } from 'vue'
import { useI18n } from 'vue-i18n'

const { defaults } = defineProps<{
  rows: V2vVmLaunchOptionsRow[]
  defaults: V2vVmLaunchOptions
}>()

const emit = defineEmits<{
  changeOption: [vmId: V2vVmLaunchOptionsRow['id'], option: V2vVmLaunchOption, value: boolean | undefined]
}>()

const { t } = useI18n()

function renderOptionSelect(row: V2vVmLaunchOptionsRow, option: V2vVmLaunchOption) {
  return renderBodyCell(() =>
    h(V2vLaunchOptionSelect, {
      modelValue: row.overrides?.[option],
      defaultValue: defaults[option],
      'onUpdate:modelValue': value => emit('changeOption', row.id, option, value),
    })
  )
}

const { HeadCells, BodyCells } = useV2vVmLaunchOptionsColumns({
  body: (row: V2vVmLaunchOptionsRow) => ({
    vm: renderer => renderer(row.name),
    stopSource: () => renderOptionSelect(row, 'stopSource'),
    docking: () => renderOptionSelect(row, 'docking'),
    startVm: () => renderOptionSelect(row, 'startVm'),
  }),
})
</script>
