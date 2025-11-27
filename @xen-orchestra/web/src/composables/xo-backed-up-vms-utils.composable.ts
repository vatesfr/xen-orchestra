import { useXoPoolCollection } from '@/remote-resources/use-xo-pool-collection.ts'
import { useXoVmCollection } from '@/remote-resources/use-xo-vm-collection.ts'
import { extractIdsFromSimplePattern, destructSmartPattern } from '@/utils/pattern.util.ts'
import { toComputed } from '@core/utils/to-computed.util.ts'
import type { XoVmBackupJob, XoVm, VM_POWER_STATE } from '@vates/types'
import * as ValueMatcher from 'value-matcher'
import { computed, type MaybeRefOrGetter } from 'vue'

export type VmsSmartModeEnabled = {
  $pool?: Record<string, unknown>
  power_state?: VM_POWER_STATE
  tags?: Record<string, unknown>
  type: 'VM'
}

export function useXoBackedUpVmsUtils(rawBackedUpVmsConfig: MaybeRefOrGetter<XoVmBackupJob['vms']>) {
  const { getPoolsByIds } = useXoPoolCollection()
  const { getVmsByIds, vms } = useXoVmCollection()

  const backedUpVmsConfig = toComputed(rawBackedUpVmsConfig)

  function checkSmartModeEnabled(value: XoVmBackupJob['vms'] | undefined): value is VmsSmartModeEnabled {
    if (value === undefined || typeof value !== 'object' || value === null) {
      return false
    }

    return !('id' in value)
  }

  const isSmartModeEnabled = computed(() => checkSmartModeEnabled(backedUpVmsConfig.value))

  const backedUpVms = computed(() => {
    if (checkSmartModeEnabled(backedUpVmsConfig.value)) {
      const predicate = ValueMatcher.createPredicate(backedUpVmsConfig.value)

      return vms.value.filter(vm => predicate(vm) && !vm.tags?.includes('xo:no-bak'))
    }

    return getVmsByIds(extractIdsFromSimplePattern(backedUpVmsConfig.value) as XoVm['id'][])
  })

  const backedUpVmsCount = computed(() => backedUpVms.value.length)

  const smartModePools = computed(() => {
    if (!checkSmartModeEnabled(backedUpVmsConfig.value) || backedUpVmsConfig.value.$pool === undefined) {
      return undefined
    }

    const poolIds = destructSmartPattern(backedUpVmsConfig.value.$pool)

    if (!poolIds) {
      return undefined
    }

    return {
      included: getPoolsByIds(poolIds.values),
      excluded: getPoolsByIds(poolIds.notValues),
    }
  })

  const smartModeTags = computed(() => {
    if (!checkSmartModeEnabled(backedUpVmsConfig.value) || backedUpVmsConfig.value.tags === undefined) {
      return undefined
    }

    const tags = destructSmartPattern(backedUpVmsConfig.value.tags)

    return {
      included: tags.values?.flat(),
      excluded: [...tags.notValues?.flat(), 'xo:no-bak'],
    }
  })

  const smartModePowerState = computed(() => {
    if (!checkSmartModeEnabled(backedUpVmsConfig.value) || backedUpVmsConfig.value.power_state === undefined) {
      return undefined
    }

    return backedUpVmsConfig.value.power_state
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
