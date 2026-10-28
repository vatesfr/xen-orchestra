<template>
  <VtsContentSidePanel>
    <div class="v2v-mapping-step">
      <VtsStateHero v-if="isBusy" format="page" type="busy" size="medium" />
      <template v-else-if="activeVm !== undefined">
        <V2vNewVmMapping
          v-if="activeVm.kind === 'new'"
          :heading="activeVm.heading"
          :vm="activeVm.vm"
          :list="activeVm.list"
          :list-issue="activeVm.listIssue"
          :update-vm
          @remove="remove(activeVm.id)"
        />
        <V2vResumedVmMapping
          v-else-if="activeVm.kind === 'resume'"
          :heading="activeVm.heading"
          :vm="activeVm.vm"
          :import-vm="activeVm.importVm"
          :last-sync-at="activeVm.lastSyncAt"
        />
        <template v-else>
          <V2vMappingVmHeader :heading="activeVm.heading" action="remove" @remove="remove(activeVm.id)" />
          <VtsStateHero format="page" type="not-found" size="medium">
            {{ t('v2v:not-found-in-source') }}
          </VtsStateHero>
        </template>
      </template>
      <V2vWizardStepActions class="actions" @back="back()">
        <V2vShowSelectedVmsButton :count="selectedVmsPanel.count" />
        <UiButton accent="brand" variant="primary" size="medium" @click="next()">
          {{ t('action:next-review') }}
        </UiButton>
      </V2vWizardStepActions>
    </div>
    <V2vSelectedVmsPanel v-bind="selectedVmsPanel" @remove="id => remove(id)" @clear="clear()" />
  </VtsContentSidePanel>
</template>

<script lang="ts" setup>
import V2vMappingVmHeader from '@/modules/v2v/components/mapping/V2vMappingVmHeader.vue'
import V2vNewVmMapping from '@/modules/v2v/components/mapping/V2vNewVmMapping.vue'
import V2vResumedVmMapping from '@/modules/v2v/components/mapping/V2vResumedVmMapping.vue'
import V2vSelectedVmsPanel from '@/modules/v2v/components/selected-vms/V2vSelectedVmsPanel.vue'
import V2vShowSelectedVmsButton from '@/modules/v2v/components/selected-vms/V2vShowSelectedVmsButton.vue'
import V2vWizardStepActions from '@/modules/v2v/components/wizard/V2vWizardStepActions.vue'
import { useV2vMappingStep } from '@/modules/v2v/composables/use-v2v-mapping-step.composable.ts'
import VtsContentSidePanel from '@core/components/layout/VtsContentSidePanel.vue'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const { isBusy, activeVm, updateVm, selectedVmsPanel, remove, clear, back, next } = useV2vMappingStep()
</script>

<style lang="postcss" scoped>
.v2v-mapping-step {
  display: flex;
  flex-direction: column;

  .actions {
    padding: 0 1.6rem 1.6rem;
  }
}
</style>
