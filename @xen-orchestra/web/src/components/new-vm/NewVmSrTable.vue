<template>
  <VtsTableNew>
    <thead>
      <tr>
        <HeadCells />
      </tr>
    </thead>
    <tbody>
      <template v-if="vmState.existingVdis && vmState.existingVdis.length > 0">
        <VtsRow v-for="(vdi, index) in vmState.existingVdis" :key="index">
          <BodyCells :item="{ vdi }" />
        </VtsRow>
      </template>
      <template v-if="vmState.vdis && vmState.vdis.length > 0">
        <VtsRow v-for="(vdi, index) in vmState.vdis" :key="index">
          <BodyCells :item="{ vdi, onRemove: () => emit('remove', index) }" />
        </VtsRow>
      </template>
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
import type { Vdi, VmState } from '@/types/xo/new-vm.type'
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
import type { XoSr } from '@vates/types'
import { toRef } from 'vue'
import { useI18n } from 'vue-i18n'

const { vmState, srs } = defineProps<{
  vmState: VmState
  srs: XoSr[]
}>()

const emit = defineEmits<{
  add: []
  remove: [index: number]
}>()

const { t } = useI18n()

const useNewVmSrColumns = defineColumns(() => {
  return {
    sr: useSelectColumn({
      headerLabel: () => t('storage-repositories'),
      headerIcon: 'fa:database',
    }),

    diskName: useInputColumn({
      headerLabel: () => t('disk-name'),
      placeholder: () => t('disk-name'),
    }),

    size: useInputColumn({
      type: 'number',
      headerLabel: () => `${t('size')} (GB)`,
      headerIcon: 'fa:memory',
    }),

    description: useInputColumn({
      headerLabel: () => t('description'),
      placeholder: () => t('description'),
    }),

    remove: useButtonIconColumn({ buttonIcon: 'fa:trash' }),
  }
})

const { HeadCells, BodyCells, colspan } = useNewVmSrColumns({
  body: ({ vdi, onRemove }: { vdi: Vdi; onRemove?: () => void }) => {
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

    return {
      sr: r => r(srSelectId),
      diskName: r => r(toRef(vdi, 'name_label')),
      size: r => r(toRef(vdi, 'size')),
      description: r => r(toRef(vdi, 'name_description')),
      remove: r => (onRemove ? r(onRemove) : renderBodyCell()),
    }
  },
})
</script>
