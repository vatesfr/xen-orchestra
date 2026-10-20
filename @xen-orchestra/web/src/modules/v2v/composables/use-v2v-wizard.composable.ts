import { useV2vIsUnknownPool } from '@/modules/v2v/composables/use-v2v-is-unknown-pool.composable.ts'
import { useV2vMigrationList } from '@/modules/v2v/composables/use-v2v-migration-list.composable.ts'
import { useV2vPoolQuery } from '@/modules/v2v/composables/use-v2v-pool-query.composable.ts'
import { useV2vSourceAndDestination } from '@/modules/v2v/composables/use-v2v-source-and-destination.composable.ts'
import { useV2vConnectionStore } from '@/modules/v2v/stores/v2v-connection.store.ts'
import { resolveV2vWizardStep } from '@/modules/v2v/utils/v2v-wizard-step.util.ts'
import { useRouteQuery } from '@core/composables/route-query.composable.ts'
import { storeToRefs } from 'pinia'
import { computed, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'

export function useV2vWizard() {
  const { t } = useI18n()

  const connectionStore = useV2vConnectionStore()

  const { connection, sourceId } = storeToRefs(connectionStore)

  const requestedStep = useRouteQuery('step')

  const pool = useV2vPoolQuery()

  const { list, hasVms } = useV2vMigrationList(sourceId, pool)

  const { sourceHost, poolName } = useV2vSourceAndDestination(pool)

  // The list of a pool this XO does not know cannot be migrated to: its destination is to be chosen again
  const isUnknownPool = useV2vIsUnknownPool(pool)

  const currentStep = computed(() =>
    resolveV2vWizardStep(requestedStep.value, {
      hasConnection: connection.value !== undefined,
      hasDestination: list.value !== undefined && !isUnknownPool.value,
      hasVms: hasVms.value,
    })
  )

  const summary = computed(() => {
    if (currentStep.value === 'source') {
      return t('v2v:choose-vmware-source')
    }

    const source = sourceHost.value
    const destination = poolName.value

    const showsDestination = currentStep.value !== 'destination' && source !== undefined && destination !== undefined

    return showsDestination ? t('source-to-destination', { source, destination }) : source
  })

  // The credentials are kept in memory only while the wizard is open (spec)
  onUnmounted(() => connectionStore.clear())

  return { currentStep, summary }
}
