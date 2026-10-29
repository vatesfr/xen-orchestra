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
import type { V2vLaunchSettings, V2vVmLaunchOptionsRow } from '@/modules/v2v/types/v2v-launch.type.ts'
import VtsRow from '@core/components/table/VtsRow.vue'
import VtsTable from '@core/components/table/VtsTable.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import { defineColumns } from '@core/packages/table/define-columns.ts'
import { useTextColumn } from '@core/tables/column-definitions/text-column.ts'
import { renderBodyCell } from '@core/tables/helpers/render-body-cell.ts'
import { h } from 'vue'
import { useI18n } from 'vue-i18n'

const { defaultStopSource } = defineProps<{
  rows: V2vVmLaunchOptionsRow[]
  defaultStopSource: V2vLaunchSettings['stopSource']
}>()

const emit = defineEmits<{
  changeStopSource: [vmId: V2vVmLaunchOptionsRow['id'], value: boolean | undefined]
}>()

const { t } = useI18n()

const useVmLaunchOptionsColumns = defineColumns(() => ({
  vm: useTextColumn({ headerLabel: () => t('vm') }),
  stopSource: useTextColumn({ headerLabel: () => t('v2v:stop-source') }),
  startVm: useTextColumn({ headerLabel: () => t('v2v:start-on-xcp-ng') }),
  cleanup: useTextColumn({ headerLabel: () => t('v2v:clean-up-preview') }),
}))

const { HeadCells, BodyCells } = useVmLaunchOptionsColumns({
  body: (row: V2vVmLaunchOptionsRow) => ({
    vm: renderer => renderer(row.name),
    stopSource: () =>
      renderBodyCell(() =>
        h(V2vLaunchOptionSelect, {
          modelValue: row.overrides?.stopSource,
          defaultValue: defaultStopSource,
          'onUpdate:modelValue': value => emit('changeStopSource', row.id, value),
        })
      ),
    startVm: renderer => renderer(t('not-supported-yet')),
    cleanup: renderer => renderer(t('not-supported-yet')),
  }),
})
</script>
