<template>
  <div class="vm-migrate-vif-mapping-table">
    <div class="bulk-actions">
      <VtsInputWrapper :label="t('destination-network')">
        <VtsSelect :id="globalNetworkSelectId" accent="brand" />
      </VtsInputWrapper>
      <UiButton
        variant="primary"
        accent="brand"
        size="medium"
        :disabled="globalNetworkId === undefined"
        @click="fillEmpty()"
      >
        {{ t('action:fill-empty-networks') }}
      </UiButton>
      <UiButton variant="secondary" accent="brand" size="medium" @click="resetAll()">
        {{ t('action:reset-all-networks') }}
      </UiButton>
    </div>
    <VtsTable :pagination-bindings>
      <thead>
        <tr>
          <HeadCells />
        </tr>
      </thead>
      <tbody>
        <VtsRow v-for="vif of paginatedVifs" :key="vif.id">
          <BodyCells :item="vif" />
        </VtsRow>
      </tbody>
    </VtsTable>
    <UiInfo accent="info" wrap>{{ t('vifs-must-be-reassigned') }}</UiInfo>
  </div>
</template>

<script lang="ts" setup>
import type { FrontXoNetwork } from '@/modules/network/remote-resources/use-xo-network-collection.ts'
import { useXoNetworkCollection } from '@/modules/network/remote-resources/use-xo-network-collection.ts'
import { useXoPifCollection } from '@/modules/pif/remote-resources/use-xo-pif-collection.ts'
import type { FrontXoVif } from '@/modules/vif/remote-resources/use-xo-vif-collection.ts'
import { useVmMigrateForm } from '@/modules/vm/composables/use-vm-migrate-form.composable.ts'
import VtsInputWrapper from '@core/components/input-wrapper/VtsInputWrapper.vue'
import VtsSelect from '@core/components/select/VtsSelect.vue'
import VtsRow from '@core/components/table/VtsRow.vue'
import VtsTable from '@core/components/table/VtsTable.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiInfo from '@core/components/ui/info/UiInfo.vue'
import { usePagination } from '@core/composables/pagination.composable.ts'
import { useFormSelect } from '@core/packages/form-select'
import { useVmMigrateVifColumns } from '@core/tables/column-sets/vm-migrate-vif-columns.ts'
import { ref, toRef } from 'vue'
import { useI18n } from 'vue-i18n'

const { vifs, destinationNetworks } = defineProps<{
  vifs: FrontXoVif[]
  destinationNetworks: FrontXoNetwork[]
}>()

const form = useVmMigrateForm()

const { t } = useI18n()

const { getNetworkById } = useXoNetworkCollection()
const { getPifsByNetworkId } = useXoPifCollection()

const globalNetworkId = ref<FrontXoNetwork['id'] | undefined>(undefined)

const { id: globalNetworkSelectId } = useFormSelect(() => destinationNetworks, {
  searchable: true,
  model: globalNetworkId,
  option: { label: 'name_label', value: 'id' },
})

function fillEmpty() {
  if (globalNetworkId.value === undefined) {
    return
  }

  for (const vif of vifs) {
    if (form.networkIdByVifId[vif.id] === undefined) {
      form.networkIdByVifId[vif.id] = globalNetworkId.value
    }
  }
}

function resetAll() {
  for (const vif of vifs) {
    form.networkIdByVifId[vif.id] = undefined
  }
}

const { pageRecords: paginatedVifs, paginationBindings } = usePagination('vm-migrate-vifs', () => vifs)

const { HeadCells, BodyCells } = useVmMigrateVifColumns({
  body: (vif: FrontXoVif) => {
    const { id: toNetworkSelectId } = useFormSelect(() => destinationNetworks, {
      searchable: true,
      model: toRef(form.networkIdByVifId, vif.id),
      emptyOption: { value: undefined, label: t('select-a-network') },
      option: { label: 'name_label', value: 'id' },
    })

    return {
      fromNetwork: r => r(getNetworkById(vif.$network)?.name_label ?? ''),
      device: r => r(`eth${vif.device}`),
      toNetwork: r => r(toNetworkSelectId),
      toVlan: r => {
        const selectedNetId = form.networkIdByVifId[vif.id]
        const pif = selectedNetId !== undefined ? getPifsByNetworkId(selectedNetId)[0] : undefined
        return r(pif === undefined || pif.vlan === -1 ? '-' : String(pif.vlan))
      },
    }
  },
})
</script>

<style scoped lang="postcss">
.vm-migrate-vif-mapping-table {
  display: flex;
  flex-direction: column;
  gap: 1.6rem;

  .bulk-actions {
    display: flex;
    flex-direction: row;
    gap: 0.8rem;
    align-items: flex-end;
  }
}
</style>
