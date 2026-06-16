<template>
  <div class="vm-migrate-vdi-mapping-table">
    <UiAlert v-if="!hasMandatoryVdi" accent="info">
      {{ t('vm-migrate-all-srs-shared') }}
    </UiAlert>
    <div class="bulk-actions">
      <VtsInputWrapper :label="t('destination-sr')">
        <VtsSelect :id="globalSrSelectId" accent="brand" />
      </VtsInputWrapper>
      <UiButton
        variant="primary"
        accent="brand"
        size="medium"
        :disabled="globalSrId === undefined"
        @click="fillEmpty()"
      >
        {{ t('action:fill-empty-srs') }}
      </UiButton>
      <UiButton variant="secondary" accent="brand" size="medium" @click="resetAll()">
        {{ t('action:reset-all-srs') }}
      </UiButton>
    </div>
    <VtsTable :pagination-bindings>
      <thead>
        <tr>
          <HeadCells />
        </tr>
      </thead>
      <tbody>
        <VtsRow v-for="vdi of paginatedVdis" :key="vdi.id">
          <BodyCells :item="vdi" />
        </VtsRow>
      </tbody>
    </VtsTable>
    <UiInfo v-if="hasMandatoryVdi" accent="info" wrap>{{ t('vdis-must-be-migrated') }}</UiInfo>
  </div>
</template>

<script lang="ts" setup>
import type { FrontXoSr } from '@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'
import { useXoSrCollection } from '@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'
import type { FrontXoVdi } from '@/modules/vdi/remote-resources/use-xo-vdi-collection.ts'
import { useVmMigrateForm } from '@/modules/vm/composables/use-vm-migrate-form.composable.ts'
import VtsInputWrapper from '@core/components/input-wrapper/VtsInputWrapper.vue'
import VtsSelect from '@core/components/select/VtsSelect.vue'
import VtsRow from '@core/components/table/VtsRow.vue'
import VtsTable from '@core/components/table/VtsTable.vue'
import UiAlert from '@core/components/ui/alert/UiAlert.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiInfo from '@core/components/ui/info/UiInfo.vue'
import { usePagination } from '@core/composables/pagination.composable.ts'
import { useFormSelect } from '@core/packages/form-select'
import { useVmMigrateVdiColumns } from '@core/tables/column-sets/vm-migrate-vdi-columns.ts'
import { formatSize } from '@core/utils/size.util.ts'
import { computed, ref, toRef } from 'vue'
import { useI18n } from 'vue-i18n'

const { vdis, destinationSrs, isVdiMandatory } = defineProps<{
  vdis: FrontXoVdi[]
  destinationSrs: FrontXoSr[]
  isVdiMandatory: (vdi: FrontXoVdi) => boolean
}>()

const form = useVmMigrateForm()

const { t } = useI18n()

const { getSrById } = useXoSrCollection()

const hasMandatoryVdi = computed(() => vdis.some(isVdiMandatory))

const globalSrId = ref<FrontXoSr['id'] | undefined>(undefined)

const { id: globalSrSelectId } = useFormSelect(() => destinationSrs, {
  searchable: true,
  model: globalSrId,
  option: { label: 'name_label', value: 'id' },
})

function fillEmpty() {
  if (globalSrId.value === undefined) {
    return
  }

  for (const vdi of vdis) {
    if (form.srIdByVdiId[vdi.id] === undefined) {
      form.srIdByVdiId[vdi.id] = globalSrId.value
    }
  }
}

function resetAll() {
  for (const vdi of vdis) {
    form.srIdByVdiId[vdi.id] = isVdiMandatory(vdi) ? undefined : vdi.$SR
  }
}

const { pageRecords: paginatedVdis, paginationBindings } = usePagination('vm-migrate-vdis', () => vdis)

const { HeadCells, BodyCells } = useVmMigrateVdiColumns({
  body: (vdi: FrontXoVdi) => {
    const { id: toSrSelectId } = useFormSelect(() => destinationSrs, {
      searchable: true,
      model: toRef(form.srIdByVdiId, vdi.id),
      emptyOption: { value: undefined, label: t('select-a-sr') },
      option: { label: 'name_label', value: 'id' },
    })

    return {
      vdi: r => r(vdi.name_label),
      usedSpace: r => r(formatSize(vdi.usage, 2)),
      fromSr: r => r(getSrById(vdi.$SR)?.name_label ?? ''),
      toSr: r => r(toSrSelectId),
    }
  },
})
</script>

<style scoped lang="postcss">
.vm-migrate-vdi-mapping-table {
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
