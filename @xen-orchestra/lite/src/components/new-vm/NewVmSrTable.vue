<template>
  <VtsTable>
    <thead>
      <tr>
        <HeadCells />
      </tr>
    </thead>
    <tbody>
      <VtsRow v-for="(vdi, index) in vmState.existingVdis" :key="index">
        <BodyCells :item="{ vdi }" />
      </VtsRow>
      <VtsRow v-for="(vdi, index) in vmState.vdis" :key="index">
        <BodyCells :item="{ vdi, onRemove: () => emit('remove', index) }" />
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
import type { XenApiSr } from '@/libs/xen-api/xen-api.types'
import type { Vdi, VmState } from '@/types/new-vm'
import VtsRow from '@core/components/table/VtsRow.vue'
import VtsTable from '@core/components/table/VtsTable.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiTableCell from '@core/components/ui/table-cell/UiTableCell.vue'
import { useFormSelect } from '@core/packages/form-select'
import { useNewVmSrColumns } from '@core/tables/column-sets/new-vm-sr-columns'
import { renderBodyCell } from '@core/tables/helpers/render-body-cell'
import { toRef } from 'vue'
import { useI18n } from 'vue-i18n'

const { vmState, srs } = defineProps<{
  vmState: VmState
  srs: XenApiSr[]
}>()

const emit = defineEmits<{
  add: []
  remove: [index: number]
}>()

const { t } = useI18n()

const { HeadCells, BodyCells, colspan } = useNewVmSrColumns({
  body: ({ vdi, onRemove }: { vdi: Vdi; onRemove?: () => void }) => {
    const { id: srSelectId } = useFormSelect(() => srs, {
      model: toRef(vdi, 'SR'),
      option: {
        id: '$ref',
        label: sr => {
          const gbLeft = Math.floor((sr.physical_size - sr.physical_utilisation) / 1024 ** 3)
          return `${sr.name_label} - ${t('n-gb-left', { n: gbLeft })}`
        },
        value: '$ref',
      },
    })

    const diskName = toRef(vdi, 'name_label')
    const size = toRef(vdi, 'size')
    const description = toRef(vdi, 'name_description')

    return {
      sr: r => r(srSelectId),
      diskName: r => r(diskName),
      size: r => r(size, { disabled: !onRemove }),
      description: r => r(description),
      remove: r => (onRemove ? r(onRemove) : renderBodyCell()),
    }
  },
})
</script>
