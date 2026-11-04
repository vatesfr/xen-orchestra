import { BASE_URL } from '@/shared/utils/fetch.util.ts'
import { defineRemoteResource } from '@core/packages/remote-resource/define-remote-resource.ts'
import type { XoBrowserMediaSession, XoVm } from '@vates/types'

export type FrontXoBrowserMedia = XoBrowserMediaSession

const browserMediaFields = [
  'id',
  'name',
  'size',
  'userId',
  'status',
  'createdAt',
  'bytesRead',
  'lastReadAt',
  'vmId',
  'vdiId',
  'insertedAt',
  'error',
] as const satisfies readonly (keyof XoBrowserMediaSession)[]

// not in the event stream of XO: polled, often enough for the bytes read to be meaningful
const POLLING_INTERVAL_MS = 5_000

/**
 * The browser media sessions of every administrator, whichever browser serves them.
 */
export const useXoBrowserMediaCollection = defineRemoteResource({
  url: `${BASE_URL}/browser-media?fields=${browserMediaFields.join(',')}`,
  pollingIntervalMs: POLLING_INTERVAL_MS,
  cacheExpirationMs: POLLING_INTERVAL_MS,
  initialData: () => [] as FrontXoBrowserMedia[],
  state: (browserMediaSessions, context) => {
    /** The session whose ISO is inserted in the VM, or being inserted or ejected. */
    function getBrowserMediaByVmId(vmId: XoVm['id']) {
      return browserMediaSessions.value.find(session => session.status !== 'connected' && session.vmId === vmId)
    }

    return {
      browserMediaSessions,
      getBrowserMediaByVmId,
      reloadBrowserMediaSessions: context.forceReload,
      hasBrowserMediaFetchError: context.hasError,
    }
  },
})
