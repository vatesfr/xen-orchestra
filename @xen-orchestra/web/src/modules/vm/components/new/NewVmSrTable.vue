<template>
  <VtsTable class="new-vm-sr-table" fixed>
    <thead>
      <tr>
        <HeadCells />
      </tr>
    </thead>
    <tbody>
      <VtsRow v-for="(vdi, index) in vdis" :id="getErrorFieldId(vdi, 'sr')" :key="vdi.key">
        <BodyCells :item="{ vdi, rank: index + 1, onRemove: () => emit('remove', vdi.key) }" />
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
</template>

<script setup lang="ts">
import type { FrontXoSr } from '@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'
import type { NewVmInvalidVdiField } from '@/modules/vm/form/new/use-new-vm-form-validation.ts'
import type { Vdi, VmState } from '@/modules/vm/types/new-xo-vm.type.ts'
import VtsRow from '@core/components/table/VtsRow.vue'
import VtsTable from '@core/components/table/VtsTable.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiTableCell from '@core/components/ui/table-cell/UiTableCell.vue'
import { useFormSelect } from '@core/packages/form-select'
import { useNewVmSrColumns } from '@core/tables/column-sets/new-vm-sr-columns.ts'
import { computed, toRef } from 'vue'
import { useI18n } from 'vue-i18n'

const { vmState, srs, canResizeExistingDisks, defaultExistingVdis, invalidFields, errorFieldId } = defineProps<{
  vmState: VmState
  srs: FrontXoSr[]
  canResizeExistingDisks: boolean
  defaultExistingVdis: Vdi[]
  invalidFields: NewVmInvalidVdiField[]
  errorFieldId: string
}>()

const emit = defineEmits<{
  add: []
  remove: [key: Vdi['key']]
}>()

const { t } = useI18n()

const vdis = computed(() => [...vmState.existingVdis, ...vmState.vdis])

function getAccent(vdi: Vdi, field: NewVmInvalidVdiField['field']) {
  return invalidFields.some(invalidField => invalidField.key === vdi.key && invalidField.field === field)
    ? 'danger'
    : 'brand'
}

// The first field in error carries the id the form focuses. On the row for an SR: its select is the first field of the row
function getErrorFieldId(vdi: Vdi, field: NewVmInvalidVdiField['field']) {
  const firstInvalidField = invalidFields[0]

  return firstInvalidField?.key === vdi.key && firstInvalidField.field === field ? errorFieldId : undefined
}

const { HeadCells, BodyCells, colspan } = useNewVmSrColumns({
  body: (item: { vdi: Vdi; rank: number; onRemove: () => void }) => {
    const { vdi, onRemove } = item

    const { id: srSelectId } = useFormSelect(() => srs, {
      model: toRef(vdi, 'sr'),
      option: {
        label: sr => {
          const gbLeft = Math.floor((sr.size - sr.physical_usage) / 1024 ** 3)
          return `${sr.name_label} - ${t('n-gb-left', { n: gbLeft })}`
        },
        value: 'id',
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
      sr: r => r(srSelectId, { accent: getAccent(vdi, 'sr') }),
      diskName: r => r(diskName),
      size: r =>
        r(size, {
          id: getErrorFieldId(vdi, 'size'),
          accent: getAccent(vdi, 'size'),
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
}
</style>
