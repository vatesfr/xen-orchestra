import { useXoPoolCollection } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import { useV2vConnection } from '@/modules/v2v/composables/use-v2v-connection.composable.ts'
import { useV2vMigrationList } from '@/modules/v2v/composables/use-v2v-migration-list.composable.ts'
import { useV2vPoolIdQuery } from '@/modules/v2v/composables/use-v2v-pool-id-query.composable.ts'
import { useV2vDestinationForm } from '@/modules/v2v/form/use-v2v-destination-form.ts'
import type { V2vWizardStep } from '@/modules/v2v/utils/v2v-wizard-step.util.ts'
import { whenever } from '@vueuse/core'
import { computed, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

export function useV2vDestinationStep() {
  const router = useRouter()

  const route = useRoute()

  const { connection, sourceId } = useV2vConnection()

  const { arePoolsReady, hasPoolById } = useXoPoolCollection()

  const poolIdQuery = useV2vPoolIdQuery()

  const poolId = ref(poolIdQuery.value)

  const migrationList = useV2vMigrationList(sourceId, poolId)

  const form = useV2vDestinationForm({ poolId, storedList: migrationList.list })

  watch(poolId, newPoolId => {
    poolIdQuery.value = newPoolId
  })

  // A reload or a shared link may name a pool this XO does not know (removed, other XO): start without it
  whenever(
    arePoolsReady,
    () => {
      const isUnknownPool = poolId.value !== undefined && !hasPoolById(poolId.value)

      if (isUnknownPool) {
        poolId.value = undefined
      }
    },
    { immediate: true }
  )

  const existingList = computed(() => {
    // An empty stored list only holds defaults: there is nothing to reopen
    const vmCount = migrationList.list.value?.vms.length ?? 0
    const sourceHost = connection.value?.host
    const pool = form.selectedPool.value

    const hasExistingList = vmCount > 0 && sourceHost !== undefined && pool !== undefined

    return hasExistingList ? { sourceHost, poolName: pool.name_label, vmCount } : undefined
  })

  // The route may not hold the chosen pool yet: its update is still pending right after a choice
  function goTo(step: V2vWizardStep) {
    return router.push({ query: { ...route.query, pool: poolId.value, step } })
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
