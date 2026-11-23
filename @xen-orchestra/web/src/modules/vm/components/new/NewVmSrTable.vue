<template>
  <div class="new-vm-sr-table">
    <VtsTable fixed>
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
          <BodyCells :item="{ vdi: row.item, rank: row.rank, onRemove: () => emit('remove', row.item.key) }" />
        </VtsRow>
        <VtsRow>
          <UiTableCell :colspan>
            <UiButton left-icon="fa:plus" variant="tertiary" accent="brand" size="medium" @click="emit('add')">
              {{ t('new') }}
            </UiButton>
          </UiTableCell>
        </VtsRow>
      </tbody>
    </VtsTable>
    <NewVmTableMessages :rows :validation :get-label="(rank, issue) => t('new-vm:vdi-issue', { n: rank, issue })" />
  </div>
</template>

<script setup lang="ts">
import { useXoSrUtils } from '@/modules/storage-repository/composables/xo-sr-utils.composable.ts'
import type { FrontXoSr } from '@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'
import NewVmTableMessages from '@/modules/vm/components/new/NewVmTableMessages.vue'
import { useNewVmTableRows } from '@/modules/vm/composables/use-new-vm-table-rows.composable.ts'
import type { NewVmTableValidation, NewVmVdiField } from '@/modules/vm/form/new/use-new-vm-form-validation.ts'
import type { Vdi, VmState } from '@/modules/vm/types/new-xo-vm.type.ts'
import { getAllVdis } from '@/modules/vm/utils/new-vm.util.ts'
import VtsRow from '@core/components/table/VtsRow.vue'
import VtsTable from '@core/components/table/VtsTable.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiTableCell from '@core/components/ui/table-cell/UiTableCell.vue'
import { useFormSelect } from '@core/packages/form-select'
import { useNewVmSrColumns } from '@core/tables/column-sets/new-vm-sr-columns.ts'
import { computed, toRef } from 'vue'
import { useI18n } from 'vue-i18n'

const { vmState, srs, canResizeExistingDisks, defaultExistingVdis, validation } = defineProps<{
  vmState: VmState
  srs: FrontXoSr[]
  canResizeExistingDisks: boolean
  defaultExistingVdis: Vdi[]
  validation: NewVmTableValidation<NewVmVdiField>
}>()

const emit = defineEmits<{
  add: []
  remove: [key: Vdi['key']]
}>()

const { t } = useI18n()

const { getSrSelectLabel, getSrStatusIcon } = useXoSrUtils()

const { rows, getErrorFieldId } = useNewVmTableRows(
  () => getAllVdis(vmState),
  () => validation,
  'sr'
)

const { HeadCells, BodyCells, colspan } = useNewVmSrColumns({
  body: (item: { vdi: Vdi; rank: number; onRemove: () => void }) => {
    const { vdi, onRemove } = item

    const { id: srSelectId } = useFormSelect(() => srs, {
      model: toRef(vdi, 'sr'),
      searchable: true,
      option: {
        label: sr => getSrSelectLabel(sr),
        value: 'id',
        properties: sr => ({ icon: getSrStatusIcon(sr) }),
      },
    })

    const diskName = toRef(vdi, 'name_label')
    const size = computed({
      get: () => vdi.size,
      set: (newSize: string | number | undefined) => {
        vdi.size = Number(newSize)
      },
    })
    const description = toRef(vdi, 'name_description')

    const defaultVdi = defaultExistingVdis.find(existingVdi => existingVdi.id === vdi.id)

    return {
      rank: r => r(item.rank),
      sr: r => r(srSelectId),
      diskName: r => r(diskName),
      size: r =>
        r(size, {
          id: getErrorFieldId(vdi.key, 'size'),
          disabled: vdi.id !== undefined && !canResizeExistingDisks,
          min: defaultVdi?.size ?? 1,
        }),
      description: r => r(description),
      remove: r => r(onRemove),
    }
  },
})
</script>

<style lang="postcss" scoped>
.new-vm-sr-table {
  --vts-table-min-width: 80rem;

  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}
</style>
