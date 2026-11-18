<template>
  <VtsContentSidePanel>
    <div class="v2v-mapping-step">
      <VtsStateHero v-if="isBusy" format="page" type="busy" size="medium" />
      <UiCard v-else>
        <V2vMappingTable :rows :update-vm @select="id => select(id)" @remove="id => remove(id)" />
      </UiCard>
      <V2vWizardStepActions @back="back()">
        <UiButton accent="brand" variant="primary" size="medium" @click="next()">
          {{ t('action:next-review') }}
        </UiButton>
      </V2vWizardStepActions>
    </div>
    <V2vVmSidePanel :vm="selectedVm" :update-vm @close="close()" @remove="id => remove(id)" />
  </VtsContentSidePanel>
</template>

<script lang="ts" setup>
import V2vMappingTable from '@/modules/v2v/components/mapping/V2vMappingTable.vue'
import V2vVmSidePanel from '@/modules/v2v/components/panel/V2vVmSidePanel.vue'
import V2vWizardStepActions from '@/modules/v2v/components/wizard/V2vWizardStepActions.vue'
import { useV2vMappingStep } from '@/modules/v2v/composables/use-v2v-mapping-step.composable.ts'
import VtsContentSidePanel from '@core/components/layout/VtsContentSidePanel.vue'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const { isBusy, rows, selectedVm, updateVm, select, close, remove, back, next } = useV2vMappingStep()
</script>

<style lang="postcss" scoped>
.v2v-mapping-step {
  display: flex;
  flex-direction: column;
  gap: 1.6rem;
  padding: 1.6rem;
}
</style>
