import { useV2vConnection } from '@/modules/v2v/composables/use-v2v-connection.composable.ts'
import { useV2vIsUnknownPool } from '@/modules/v2v/composables/use-v2v-is-unknown-pool.composable.ts'
import { useV2vMigrationList } from '@/modules/v2v/composables/use-v2v-migration-list.composable.ts'
import { useV2vPoolIdQuery } from '@/modules/v2v/composables/use-v2v-pool-id-query.composable.ts'
import { useV2vSourceAndDestination } from '@/modules/v2v/composables/use-v2v-source-and-destination.composable.ts'
import { useV2vWizardNavigation } from '@/modules/v2v/composables/use-v2v-wizard-navigation.composable.ts'
import { useV2vDestinationForm } from '@/modules/v2v/form/use-v2v-destination-form.ts'
import type { V2vWizardStep } from '@/modules/v2v/utils/v2v-wizard-step.util.ts'
import { whenever } from '@vueuse/core'
import { computed, reactive, ref, watch } from 'vue'

export function useV2vDestinationStep() {
  const { goToStep } = useV2vWizardNavigation()

  const { sourceId } = useV2vConnection()

  const poolIdQuery = useV2vPoolIdQuery()

  const poolId = ref(poolIdQuery.value)

  const migrationList = useV2vMigrationList(sourceId, poolId)

  const form = useV2vDestinationForm({ poolId, storedList: migrationList.list })

  const { sourceHost, poolName } = useV2vSourceAndDestination(poolId)

  watch(poolId, newPoolId => {
    poolIdQuery.value = newPoolId
  })

  // A pool this XO does not know cannot be chosen: start without it
  whenever(
    useV2vIsUnknownPool(poolId),
    () => {
      poolId.value = undefined
    },
    { immediate: true }
  )

  const existingList = computed(() => {
    const source = sourceHost.value
    const destination = poolName.value

    // An empty stored list only holds defaults: there is nothing to reopen
    const hasExistingList = migrationList.hasVms.value && source !== undefined && destination !== undefined

    return hasExistingList
      ? { sourceHost: source, poolName: destination, vmCount: migrationList.vmCount.value }
      : undefined
  })

  // The route may not hold the chosen pool yet: its update is still pending right after a choice
  function goTo(step: V2vWizardStep) {
    return goToStep(step, { pool: poolId.value })
  }

  async function submit() {
    const isValid = await form.validate()

    const defaults = form.defaults.value

    if (!isValid || defaults === undefined) {
      return
    }

    migrationList.saveDefaults(defaults)

    await goTo('vms')
  }

  function back() {
    return goTo('source')
  }

  return {
    form: reactive(form),
    existingList,
    submit,
    back,
  }
}
