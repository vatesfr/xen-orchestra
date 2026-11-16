import { type FrontXoPool, useXoPoolCollection } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import { getTaskRoute } from '@/modules/task/utils/xo-task.util.ts'
import { useV2vConnection } from '@/modules/v2v/composables/use-v2v-connection.composable.ts'
import { useV2vReviewLabels } from '@/modules/v2v/composables/use-v2v-review-labels.composable.ts'
import { useV2vLaunchForm } from '@/modules/v2v/form/use-v2v-launch-form.ts'
import { useXoV2vStartJob } from '@/modules/v2v/jobs/xo-v2v-start.job.ts'
import type {
  V2vLaunchPlanItem,
  V2vStartProblem,
  V2vStartVm,
  V2vVmLaunchOptionsRow,
  V2vVmLaunchOverrides,
} from '@/modules/v2v/types/v2v-launch.type.ts'
import type { V2vMigrationList } from '@/modules/v2v/types/v2v-migration-list.type.ts'
import { setV2vOverride } from '@/modules/v2v/utils/v2v-mapping.util.ts'
import { buildV2vStartPayload, getV2vStartProblems } from '@/modules/v2v/utils/v2v-start-payload.util.ts'
import { useApiErrorMessage } from '@/shared/composables/api-error-message.composable.ts'
import type { XoV2vStartPayload, XoV2vVm } from '@vates/types'
import { computed, type MaybeRefOrGetter, reactive, ref, toValue } from 'vue'
import { useI18n } from 'vue-i18n'
import type { RouteLocationRaw } from 'vue-router'

type V2vLaunchableVm = Pick<V2vLaunchPlanItem, 'id' | 'kind'> & Pick<XoV2vVm, 'name'>

type V2vLaunchContext = {
  launchableVms: MaybeRefOrGetter<V2vLaunchableVm[]>
  list: MaybeRefOrGetter<V2vMigrationList | undefined>
  getName: (id: XoV2vVm['id']) => string
}

// A refused launch tells every problem at once, so the user fixes them all before launching again
type V2vLaunchError = { title: string; messages: string[] }

type V2vLaunched = {
  count: number
  taskRoute: RouteLocationRaw
}

export function useV2vLaunch(
  rawPoolId: MaybeRefOrGetter<FrontXoPool['id']>,
  { launchableVms, list, getName }: V2vLaunchContext
) {
  const { t } = useI18n()

  const { getErrorMessage } = useApiErrorMessage()

  const { connection } = useV2vConnection()

  const { getPoolById } = useXoPoolCollection()

  const labels = useV2vReviewLabels()

  const form = useV2vLaunchForm()

  const overridesById = reactive(new Map<XoV2vVm['id'], V2vVmLaunchOverrides>())

  const destinationPool = computed(() => getPoolById(toValue(rawPoolId)))

  const vmLaunchOptionsRows = computed(() =>
    toValue(launchableVms).map(
      ({ id, name }): V2vVmLaunchOptionsRow => ({ id, name, overrides: overridesById.get(id) })
    )
  )

  const launchCount = computed(() => toValue(launchableVms).length)

  const startVms = computed(() =>
    toValue(launchableVms).flatMap(({ id, kind }): V2vStartVm[] => {
      const listVm = toValue(list)?.vms.find(vm => vm.id === id)

      if (listVm === undefined) {
        return []
      }

      const { disks, nics, template } = listVm

      return [{ id, kind, disks, nics, template, overrides: overridesById.get(id) }]
    })
  )

  const payload = ref<XoV2vStartPayload>()

  const { run, isRunning: isLaunching } = useXoV2vStartJob(destinationPool, payload)

  const launchError = ref<V2vLaunchError>()

  const launched = ref<V2vLaunched>()

  const canLaunch = computed(() => launchCount.value > 0)

  function changeStopSource(id: XoV2vVm['id'], value: boolean | undefined) {
    const overrides = setV2vOverride(overridesById.get(id), 'stopSource', value, form.formData.stopSource)

    if (overrides === undefined) {
      overridesById.delete(id)
    } else {
      overridesById.set(id, overrides)
    }
  }

  // A problem names its VM as the list does
  function getProblemLabel({ vmId, message }: V2vStartProblem) {
    return labels.getStartProblemLabel(message, vmId === undefined ? undefined : getName(vmId))
  }

  function getLaunchError(error: unknown): V2vLaunchError {
    const problems = getV2vStartProblems(error)

    if (problems !== undefined) {
      return { title: t('v2v:launch-problems'), messages: problems.map(getProblemLabel) }
    }

    return { title: t('error'), messages: [getErrorMessage(error)] }
  }

  async function launch() {
    launchError.value = undefined

    const sourceConnection = connection.value
    const migrationList = toValue(list)

    // Without a connection or a list, the wizard does not show the step: the check narrows their types
    if (sourceConnection === undefined || migrationList === undefined) {
      return
    }

    const isValid = await form.validate()
    const { concurrency } = form.formData

    // A valid form has a concurrency: the check narrows its type
    if (!isValid || concurrency === undefined) {
      return
    }

    const count = launchCount.value

    payload.value = buildV2vStartPayload({
      connection: sourceConnection,
      defaults: migrationList.defaults,
      settings: { ...form.formData, concurrency },
      vms: startVms.value,
    })

    try {
      const taskId = await run()

      launched.value = { count, taskRoute: getTaskRoute(taskId) }
    } catch (error) {
      launchError.value = getLaunchError(error)
    }
  }

  return {
    form,
    vmLaunchOptionsRows,
    launchCount,
    canLaunch,
    isLaunching,
    launchError,
    launched,
    changeStopSource,
    launch,
  }
}
