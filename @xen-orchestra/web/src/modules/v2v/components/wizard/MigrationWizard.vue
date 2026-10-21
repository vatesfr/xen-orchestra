<template>
  <div class="migration-wizard">
    <V2vWizardHeader :current-step :summary />
    <div class="content">
      <V2vSourceStep v-if="currentStep === 'source'" />
      <V2vDestinationStep v-else-if="currentStep === 'destination'" />
      <VtsStateHero v-else format="page" type="under-construction" size="medium">
        {{ t('coming-soon!') }}
      </VtsStateHero>
    </div>
  </div>
</template>

<script lang="ts" setup>
import V2vDestinationStep from '@/modules/v2v/components/destination/V2vDestinationStep.vue'
import V2vSourceStep from '@/modules/v2v/components/source/V2vSourceStep.vue'
import V2vWizardHeader from '@/modules/v2v/components/wizard/V2vWizardHeader.vue'
import { useV2vMigrationList } from '@/modules/v2v/composables/use-v2v-migration-list.composable.ts'
import { useV2vPoolQuery } from '@/modules/v2v/composables/use-v2v-pool-query.composable.ts'
import { useV2vConnectionStore } from '@/modules/v2v/stores/v2v-connection.store.ts'
import { resolveV2vWizardStep } from '@/modules/v2v/utils/v2v-wizard-step.util.ts'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import { useRouteQuery } from '@core/composables/route-query.composable.ts'
import { storeToRefs } from 'pinia'
import { computed, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const connectionStore = useV2vConnectionStore()

const { connection, sourceId } = storeToRefs(connectionStore)

const requestedStep = useRouteQuery('step')

const { list } = useV2vMigrationList(sourceId, useV2vPoolQuery())

const currentStep = computed(() =>
  resolveV2vWizardStep(requestedStep.value, {
    hasConnection: connection.value !== undefined,
    hasDestination: list.value !== undefined,
  })
)

const summary = computed(() =>
  currentStep.value === 'source' ? t('v2v:choose-vmware-source') : connection.value?.host
)

// The credentials are kept in memory only while the wizard is open (spec)
onUnmounted(() => connectionStore.clear())
</script>

<style lang="postcss" scoped>
.migration-wizard {
  display: flex;
  flex-direction: column;

  .content {
    padding: 1.6rem;
  }
}
</style>
