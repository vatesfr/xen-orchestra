import { useV2vConnection } from '@/modules/v2v/composables/use-v2v-connection.composable.ts'
import { useV2vIsUnknownPool } from '@/modules/v2v/composables/use-v2v-is-unknown-pool.composable.ts'
import { useV2vMigrationList } from '@/modules/v2v/composables/use-v2v-migration-list.composable.ts'
import { useV2vPoolIdQuery } from '@/modules/v2v/composables/use-v2v-pool-id-query.composable.ts'
import { useV2vSourceAndDestination } from '@/modules/v2v/composables/use-v2v-source-and-destination.composable.ts'
import { resolveV2vWizardStep } from '@/modules/v2v/utils/v2v-wizard-step.util.ts'
import { useRouteQuery } from '@core/composables/route-query.composable.ts'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

export function useV2vWizard() {
  const { t } = useI18n()

  const { connection, sourceId } = useV2vConnection()

  const requestedStep = useRouteQuery('step')

  const poolId = useV2vPoolIdQuery()

  const { list, hasVms } = useV2vMigrationList(sourceId, poolId)

  const { sourceHost, poolName } = useV2vSourceAndDestination(poolId)

  // The list of a pool this XO does not know cannot be migrated to: its destination is to be chosen again
  const isUnknownPool = useV2vIsUnknownPool(poolId)

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

  return { currentStep, summary }
}
