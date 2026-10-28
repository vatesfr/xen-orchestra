<template>
  <VtsContentSidePanel>
    <div class="v2v-vms-step">
      <V2vVmsFilterHeader
        :source-host
        :datastore-summary
        @remove-datastore="removeDatastoreFilter()"
        @clear-filter="clearFilter()"
      />
      <UiCard>
        <VtsQueryBuilder :model-value="filter" :schema @search="filter = $event" />
        <V2vVmPresets :presets @apply="id => applyPreset(id)" />
        <div class="selection-actions">
          <V2vShowSelectedVmsButton :count="selectedVmsPanel.count" />
          <UiButton accent="brand" variant="primary" size="medium" :disabled="!canAddSelected" @click="addSelected()">
            {{ t('v2v:action:add-to-migration-list') }}
          </UiButton>
        </div>
        <V2vVmsTable
          :view="tableView"
          :selection
          :state="tableState"
          :pagination-bindings
          @filter-datastore="name => filterByDatastore(name)"
        />
      </UiCard>
      <V2vWizardStepActions @back="back()">
        <UiButton accent="brand" variant="primary" size="medium" :disabled="!canGoNext" @click="next()">
          {{ t('action:next-mapping') }}
        </UiButton>
      </V2vWizardStepActions>
    </div>
    <V2vSelectedVmsPanel v-bind="selectedVmsPanel" @remove="id => remove(id)" @clear="clear()" />
  </VtsContentSidePanel>
</template>

<script lang="ts" setup>
import V2vSelectedVmsPanel from '@/modules/v2v/components/selected-vms/V2vSelectedVmsPanel.vue'
import V2vShowSelectedVmsButton from '@/modules/v2v/components/selected-vms/V2vShowSelectedVmsButton.vue'
import V2vVmPresets from '@/modules/v2v/components/vms/V2vVmPresets.vue'
import V2vVmsFilterHeader from '@/modules/v2v/components/vms/V2vVmsFilterHeader.vue'
import V2vVmsTable from '@/modules/v2v/components/vms/V2vVmsTable.vue'
import V2vWizardStepActions from '@/modules/v2v/components/wizard/V2vWizardStepActions.vue'
import { useV2vVmsStep } from '@/modules/v2v/composables/use-v2v-vms-step.composable.ts'
import VtsContentSidePanel from '@core/components/layout/VtsContentSidePanel.vue'
import VtsQueryBuilder from '@core/components/query-builder/VtsQueryBuilder.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const {
  sourceHost,
  filter,
  schema,
  tableView,
  paginationBindings,
  tableState,
  selection,
  canAddSelected,
  addSelected,
  datastoreSummary,
  filterByDatastore,
  removeDatastoreFilter,
  clearFilter,
  presets,
  applyPreset,
  canGoNext,
  back,
  next,
  selectedVmsPanel,
  remove,
  clear,
} = useV2vVmsStep()
</script>

<style lang="postcss" scoped>
.v2v-vms-step {
  display: flex;
  flex-direction: column;
  gap: 1.6rem;
  padding: 1.6rem;

  .selection-actions {
    display: flex;
    justify-content: flex-end;
    gap: 0.8rem;
  }
}
</style>
