<template>
  <VtsTable>
    <thead>
      <tr>
        <HeadCells />
      </tr>
    </thead>
    <tbody>
      <VtsRow v-for="vdi in vdis" :key="vdi.key">
        <BodyCells :item="{ vdi, onRemove: () => emit('remove', vdi.key) }" />
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
import type { Vdi, VmState } from '@/modules/vm/types/new-xo-vm.type.ts'
import VtsRow from '@core/components/table/VtsRow.vue'
import VtsTable from '@core/components/table/VtsTable.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiTableCell from '@core/components/ui/table-cell/UiTableCell.vue'
import { useFormSelect } from '@core/packages/form-select'
import { useNewVmSrColumns } from '@core/tables/column-sets/new-vm-sr-columns.ts'
import { computed, toRef } from 'vue'
import { useI18n } from 'vue-i18n'

const { vmState, srs, canResizeExistingDisks, defaultExistingVdis } = defineProps<{
  vmState: VmState
  srs: FrontXoSr[]
  canResizeExistingDisks: boolean
  defaultExistingVdis: Vdi[]
}>()

const emit = defineEmits<{
  add: []
  remove: [key: Vdi['key']]
}>()

const { t } = useI18n()

const vdis = computed(() => [...vmState.existingVdis, ...vmState.vdis])

const { HeadCells, BodyCells, colspan } = useNewVmSrColumns({
  body: ({ vdi, onRemove }: { vdi: Vdi; onRemove: () => void }) => {
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
    const size = toRef(vdi, 'size')
    const description = toRef(vdi, 'name_description')

    const defaultVdi = defaultExistingVdis.find(existingVdi => existingVdi.id === vdi.id)

    return {
      sr: r => r(srSelectId),
      diskName: r => r(diskName),
      size: r =>
        r(size, {
          disabled: vdi.id !== undefined && !canResizeExistingDisks,
          min: defaultVdi?.size ?? 1,
        }),
      description: r => r(description),
      remove: r => r(onRemove),
    }
  },
})
</script>
