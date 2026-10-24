import { useXoHostCollection } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import { type FrontXoPool, useXoPoolCollection } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import { useVdfInfo } from '@/modules/vdf/remote-resources/use-vdf-info.ts'
import { VDF_STATUS_KEY } from '@/modules/vdf/utils/vdf-status.util.ts'
import { computed } from 'vue'

// Tech preview (vdf#42): the firewall interface shows only while the vdf
// plugin is loaded; the VM screens and quarantine only in pools VDF manages:
// a host's agent wrote a status, or a policy is published. The published
// policy outlives an agent stopped, cleared or removed, whose VMs must
// still show, as exposed (vdf#37).
export function useVdfAvailability() {
  const { info, isVdfInfoReady, hasVdfInfoError } = useVdfInfo()

  const { hosts, areHostsReady } = useXoHostCollection()

  const { pools, arePoolsReady } = useXoPoolCollection()

  const isVdfEnabled = computed(() => !hasVdfInfoError.value && info.value?.techPreview === true)

  const isVdfAvailabilityReady = computed(
    () => hasVdfInfoError.value || (isVdfInfoReady.value && areHostsReady.value && arePoolsReady.value)
  )

  const poolIdsWithAgent = computed(
    () =>
      new Set([
        ...hosts.value.filter(host => host.otherConfig?.[VDF_STATUS_KEY] !== undefined).map(host => host.$pool),
        ...pools.value
          .filter(pool => Object.keys(pool.otherConfig ?? {}).some(key => key.startsWith('vdf:policy')))
          .map(pool => pool.id),
      ])
  )

  const hasVdfAgent = (poolId: string) => poolIdsWithAgent.value.has(poolId as FrontXoPool['id'])

  return { isVdfEnabled, isVdfAvailabilityReady, hasVdfAgent }
}
