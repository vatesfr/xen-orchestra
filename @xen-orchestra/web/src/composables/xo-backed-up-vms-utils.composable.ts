import { useXoPoolCollection } from '@/remote-resources/use-xo-pool-collection.ts'
import { useXoVmCollection } from '@/remote-resources/use-xo-vm-collection.ts'
import type { VmsSmartModeDisabled, VmsSmartModeEnabled, XoVmBackupJob } from '@/types/xo/vm-backup-job.type.ts'
import type { XoVm } from '@/types/xo/vm.type.ts'
import { extractIdsFromSimplePattern, destructSmartPattern } from '@/utils/pattern.util.ts'
import { toComputed } from '@core/utils/to-computed.util.ts'
import * as ValueMatcher from 'value-matcher'
import { computed, type MaybeRefOrGetter } from 'vue'

export function useXoBackedUpVmsUtils(_rawBackedUpVms: MaybeRefOrGetter<XoVmBackupJob['vms']>) {
  const { getPoolsByIds } = useXoPoolCollection()
  const { getVmsByIds, vms } = useXoVmCollection()

  const rawBackedUpVms = toComputed(_rawBackedUpVms)

  function checkSmartModeEnabled(
    value: VmsSmartModeEnabled | VmsSmartModeDisabled | undefined
  ): value is VmsSmartModeEnabled {
    if (value === undefined || typeof value !== 'object' || value === null) {
      return false
    }

    return !('id' in value)
  }

  const isSmartModeEnabled = computed(() => checkSmartModeEnabled(rawBackedUpVms.value))

  const backedUpVms = computed(() => {
    if (checkSmartModeEnabled(rawBackedUpVms.value)) {
      const predicate = ValueMatcher.createPredicate(rawBackedUpVms.value)

      return vms.value.filter(vm => predicate(vm) && !vm.tags?.includes('xo:no-bak'))
    }

    return getVmsByIds(extractIdsFromSimplePattern(rawBackedUpVms.value) as XoVm['id'][])
  })

  const backedUpVmsCount = computed(() => backedUpVms.value.length)

  const smartModePools = computed(() => {
    if (!checkSmartModeEnabled(rawBackedUpVms.value) || rawBackedUpVms.value.$pool === undefined) {
      return undefined
    }

    const poolIds = destructSmartPattern(rawBackedUpVms.value.$pool)

    if (!poolIds) {
      return undefined
    }

    return {
      included: getPoolsByIds(poolIds.values),
      excluded: getPoolsByIds(poolIds.notValues),
    }
  })

  const smartModeTags = computed(() => {
    if (!checkSmartModeEnabled(rawBackedUpVms.value) || rawBackedUpVms.value.tags === undefined) {
      return undefined
    }

    const tags = destructSmartPattern(rawBackedUpVms.value.tags)

    return {
      included: tags.values?.flat(),
      excluded: [...tags.notValues?.flat(), 'xo:no-bak'],
    }
  })

  const smartModePowerState = computed(() => {
    if (!checkSmartModeEnabled(rawBackedUpVms.value) || rawBackedUpVms.value.power_state === undefined) {
      return undefined
    }

    return rawBackedUpVms.value.power_state
  })

  return {
    backedUpVms,
    backedUpVmsCount,
    isSmartModeEnabled,
    smartModePools,
    smartModePowerState,
    smartModeTags,
  }
}
