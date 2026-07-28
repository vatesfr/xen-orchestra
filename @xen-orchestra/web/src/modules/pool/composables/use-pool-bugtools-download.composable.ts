import { useXoHostCollection } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import type { FrontXoPool } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import { downloadBugTools } from '@core/utils/download-bugtools.utils.ts'
import { computed, type MaybeRefOrGetter, toValue } from 'vue'

export function usePoolBugToolsDownload(rawPoolId: MaybeRefOrGetter<FrontXoPool['id'] | undefined>) {
  const { getMasterHostByPoolId, areHostsFetching, areHostsReady, hasHostFetchError } = useXoHostCollection()

  const masterHost = computed(() => {
    const poolId = toValue(rawPoolId)

    return poolId === undefined ? undefined : getMasterHostByPoolId(poolId)
  })

  const isDisabled = computed(
    () => hasHostFetchError.value || (areHostsReady.value && masterHost.value?.address === undefined)
  )

  function download() {
    const address = masterHost.value?.address

    if (address === undefined) {
      return
    }

    downloadBugTools(address)
  }

  return { download, isBusy: areHostsFetching, isDisabled }
}
