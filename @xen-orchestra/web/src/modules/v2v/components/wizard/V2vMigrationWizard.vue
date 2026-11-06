<template>
  <div class="v2v-migration-wizard">
    <V2vWizardHeader :current-step :summary />
    <!-- Their side panel sits flush with the page edges, as on every page with one: the step lays out its own padding -->
    <V2vVmsStep v-if="currentStep === 'vms'" />
    <V2vMappingStep v-else-if="currentStep === 'mapping'" />
    <div v-else class="content">
      <V2vSourceStep v-if="currentStep === 'source'" />
      <V2vDestinationStep v-else-if="currentStep === 'destination'" />
      <V2vReviewStep v-else />
    </div>
  </div>
</template>

<script lang="ts" setup>
import V2vDestinationStep from '@/modules/v2v/components/destination/V2vDestinationStep.vue'
import V2vMappingStep from '@/modules/v2v/components/mapping/V2vMappingStep.vue'
import V2vReviewStep from '@/modules/v2v/components/review/V2vReviewStep.vue'
import V2vSourceStep from '@/modules/v2v/components/source/V2vSourceStep.vue'
import V2vVmsStep from '@/modules/v2v/components/vms/V2vVmsStep.vue'
import V2vWizardHeader from '@/modules/v2v/components/wizard/V2vWizardHeader.vue'
import { useV2vWizard } from '@/modules/v2v/composables/use-v2v-wizard.composable.ts'

const { currentStep, summary } = useV2vWizard()
</script>

<style lang="postcss" scoped>
.v2v-migration-wizard {
  display: flex;
  flex-direction: column;

  .content {
    padding: 1.6rem;
  }
}
</style>
