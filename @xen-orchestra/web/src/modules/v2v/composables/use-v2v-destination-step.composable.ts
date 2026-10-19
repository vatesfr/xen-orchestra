import { useXoPoolCollection } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import { useV2vMigrationList } from '@/modules/v2v/composables/use-v2v-migration-list.composable.ts'
import { useV2vPoolQuery } from '@/modules/v2v/composables/use-v2v-pool-query.composable.ts'
import { useV2vWizardNavigation } from '@/modules/v2v/composables/use-v2v-wizard-navigation.composable.ts'
import { useV2vDestinationForm } from '@/modules/v2v/form/use-v2v-destination-form.ts'
import { useV2vConnectionStore } from '@/modules/v2v/stores/v2v-connection.store.ts'
import type { V2vWizardStep } from '@/modules/v2v/utils/v2v-wizard-step.util.ts'
import { whenever } from '@vueuse/core'
import { computed, reactive, ref, watch } from 'vue'

export function useV2vDestinationStep() {
  const { goToStep } = useV2vWizardNavigation()

  const connectionStore = useV2vConnectionStore()

  const { arePoolsReady, hasPoolById } = useXoPoolCollection()

  const poolQuery = useV2vPoolQuery()

  const pool = ref(poolQuery.value)

  const migrationList = useV2vMigrationList(() => connectionStore.sourceId, pool)

  const form = useV2vDestinationForm({ pool, storedList: migrationList.list })

  watch(pool, newPool => {
    poolQuery.value = newPool
  })

  // A reload or a shared link may name a pool this XO does not know (removed, other XO): start without it
  whenever(
    arePoolsReady,
    () => {
      const isUnknownPool = pool.value !== undefined && !hasPoolById(pool.value)

      if (isUnknownPool) {
        pool.value = undefined
      }
    },
    { immediate: true }
  )

  const existingList = computed(() => {
    // An empty stored list only holds defaults: there is nothing to reopen
    const vmCount = migrationList.list.value?.vms.length ?? 0
    const sourceHost = connectionStore.connection?.host
    const pool = form.selectedPool.value

    const hasExistingList = vmCount > 0 && sourceHost !== undefined && pool !== undefined

    return hasExistingList ? { sourceHost, poolName: pool.name_label, vmCount } : undefined
  })

  // The route may not hold the chosen pool yet: its update is still pending right after a choice
  function goTo(step: V2vWizardStep) {
    return goToStep(step, { pool: pool.value })
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
