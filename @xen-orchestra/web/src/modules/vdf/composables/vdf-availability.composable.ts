import { useXoHostCollection } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import type { FrontXoPool } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import { useVdfInfo } from '@/modules/vdf/remote-resources/use-vdf-info.ts'
import { VDF_STATUS_KEY } from '@/modules/vdf/utils/vdf-status.util.ts'
import { computed } from 'vue'

// Tech preview (vdf#42): the firewall interface shows only while the vdf
// plugin is loaded; the VM screens and quarantine only in pools where an
// agent ever wrote a status (a stopped agent's VMs still show, as exposed).
export function useVdfAvailability() {
  const { info, isVdfInfoReady, hasVdfInfoError } = useVdfInfo()

  const { hosts, areHostsReady } = useXoHostCollection()

  const isVdfEnabled = computed(() => !hasVdfInfoError.value && info.value?.techPreview === true)

  const isVdfAvailabilityReady = computed(() => hasVdfInfoError.value || (isVdfInfoReady.value && areHostsReady.value))

  const poolIdsWithAgent = computed(
    () => new Set(hosts.value.filter(host => host.otherConfig?.[VDF_STATUS_KEY] !== undefined).map(host => host.$pool))
  )

  const hasVdfAgent = (poolId: string) => poolIdsWithAgent.value.has(poolId as FrontXoPool['id'])

  return { isVdfEnabled, isVdfAvailabilityReady, hasVdfAgent }
}
