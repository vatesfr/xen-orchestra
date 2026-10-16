import { useXoHostCollection } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import { useXoPbdCollection } from '@/modules/pbd/remote-resources/use-xo-pbd-collection.ts'
import { useXoPoolCollection } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import { usePrivilegeSelectorMatches } from '@/modules/role/composables/use-privilege-selector-matches.composable.ts'
import type { PrivilegeScopeObject } from '@/modules/role/types.ts'
import type { SelectablePrivilegeResource } from '@/modules/role/utils/privilege-catalogue.util.ts'
import {
  toHostScopeObject,
  toPoolScopeObject,
  toScopeObject,
  toSrScopeObject,
  toVmScopeObject,
} from '@/modules/role/utils/privilege-scope-object.util.ts'
import { useXoSrCollection } from '@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'
import { useXoVmCollection } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { toComputed } from '@core/utils/to-computed.util.ts'
import { computed, type MaybeRefOrGetter } from 'vue'

type PrivilegeScopeObjectsSource = {
  objects: PrivilegeScopeObject[]
  isReady: boolean
  hasError: boolean
}

export function usePrivilegeScopeObjects(resourceRaw: MaybeRefOrGetter<SelectablePrivilegeResource | undefined>) {
  const resource = toComputed(resourceRaw)

  const useIsResource = (candidate: SelectablePrivilegeResource) => computed(() => resource.value === candidate)

  const { vms, areVmsReady, hasVmFetchError } = useXoVmCollection({
    isEnabled: useIsResource('vm'),
  })

  const { hosts, areHostsReady, hasHostFetchError } = useXoHostCollection({
    isEnabled: useIsResource('host'),
  })

  const { srs, areSrsReady, hasSrFetchError } = useXoSrCollection({
    isEnabled: useIsResource('sr'),
  })

  const { pbdsBySr, arePbdsReady, hasPbdFetchError } = useXoPbdCollection({
    isEnabled: useIsResource('sr'),
  })

  const { pools, arePoolsReady, hasPoolFetchError } = useXoPoolCollection({
    isEnabled: useIsResource('pool'),
  })

  const dedicatedSources: Partial<Record<SelectablePrivilegeResource, () => PrivilegeScopeObjectsSource>> = {
    vm: () => ({
      objects: vms.value.map(toVmScopeObject),
      isReady: areVmsReady.value,
      hasError: hasVmFetchError.value,
    }),
    host: () => ({
      objects: hosts.value.map(toHostScopeObject),
      isReady: areHostsReady.value,
      hasError: hasHostFetchError.value,
    }),
    sr: () => ({
      objects: srs.value.map(sr => toSrScopeObject(sr, pbdsBySr.value.get(sr.id) ?? [])),
      isReady: areSrsReady.value && arePbdsReady.value,
      hasError: hasSrFetchError.value || hasPbdFetchError.value,
    }),
    pool: () => ({
      objects: pools.value.map(toPoolScopeObject),
      isReady: arePoolsReady.value,
      hasError: hasPoolFetchError.value,
    }),
  }

  const genericResource = computed(() =>
    resource.value === undefined || dedicatedSources[resource.value] !== undefined ? undefined : resource.value
  )

  const {
    matches,
    isReady: areMatchesReady,
    hasError: hasMatchesError,
  } = usePrivilegeSelectorMatches({
    resource: genericResource,
    selector: '',
    isEnabled: () => genericResource.value !== undefined,
  })

  const source = computed<PrivilegeScopeObjectsSource>(() => {
    if (resource.value === undefined) {
      return { objects: [], isReady: false, hasError: false }
    }

    const dedicatedSource = dedicatedSources[resource.value]

    if (dedicatedSource !== undefined) {
      return dedicatedSource()
    }

    const currentResource = resource.value

    return {
      objects: matches.value.map(match => toScopeObject(currentResource, match)),
      isReady: areMatchesReady.value,
      hasError: hasMatchesError.value,
    }
  })

  return {
    objects: computed(() => source.value.objects),
    isReady: computed(() => source.value.isReady),
    hasError: computed(() => source.value.hasError),
  }
}
