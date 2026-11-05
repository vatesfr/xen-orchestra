import type { FrontXoVmBackupJob } from '@/modules/backup-job/remote-resources/use-xo-backup-job-collection.ts'
import { isBackupJobVmsSmartMode } from '@/modules/backup-job/utils/xo-backup-job.util.ts'
import { useXoPoolCollection } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import { useXoVmCollection, type FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { vmContainsNoBakTag } from '@/modules/vm/utils/xo-vm.util.ts'
import { destructSmartPattern } from '@/shared/utils/pattern.util.ts'
import { toComputed } from '@core/utils/to-computed.util.ts'
import { extractIdsFromSimplePattern } from '@xen-orchestra/backups/extractIdsFromSimplePattern.mjs'
import * as ValueMatcher from 'value-matcher'
import { computed, type MaybeRefOrGetter } from 'vue'

export function useXoBackedUpVmsUtils(rawBackedUpVmsConfig: MaybeRefOrGetter<FrontXoVmBackupJob['vms']>) {
  const { getPoolsByIds } = useXoPoolCollection()
  const { getVmsByIds, vms } = useXoVmCollection()

  const backedUpVmsConfig = toComputed(rawBackedUpVmsConfig)

  const isSmartModeEnabled = computed(() => isBackupJobVmsSmartMode(backedUpVmsConfig.value))

  const backedUpVms = computed(() => {
    if (isBackupJobVmsSmartMode(backedUpVmsConfig.value)) {
      const predicate = ValueMatcher.createPredicate(backedUpVmsConfig.value)

      return vms.value.filter(vm => predicate(vm) && !vmContainsNoBakTag(vm))
    }

    return getVmsByIds(extractIdsFromSimplePattern<FrontXoVm['id']>(backedUpVmsConfig.value))
  })

  const backedUpVmsCount = computed(() => backedUpVms.value.length)

  const smartModePools = computed(() => {
    if (!isBackupJobVmsSmartMode(backedUpVmsConfig.value) || backedUpVmsConfig.value.$pool === undefined) {
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
    if (!isBackupJobVmsSmartMode(backedUpVmsConfig.value) || backedUpVmsConfig.value.tags === undefined) {
      return undefined
    }

    const tags = destructSmartPattern(backedUpVmsConfig.value.tags)

    return {
      included: tags.values?.flat() ?? [],
      excluded: [...(tags.notValues?.flat() ?? []), 'xo:no-bak'],
    }
  })

  const smartModePowerState = computed(() =>
    isBackupJobVmsSmartMode(backedUpVmsConfig.value) ? backedUpVmsConfig.value.power_state : undefined
  )

  return {
    backedUpVms,
    backedUpVmsCount,
    isSmartModeEnabled,
    smartModePools,
    smartModePowerState,
    smartModeTags,
  }
}
