import { useXoCollectionState } from '@/shared/composables/xo-collection-state/use-xo-collection-state.ts'
import { BASE_URL } from '@/shared/utils/fetch.util.ts'
import { defineRemoteResource } from '@core/packages/remote-resource/define-remote-resource.ts'
import type { XoBrowserMediaSession, XoVm } from '@vates/types'

// not a `Pick`: the fields below are all of them, and a `Pick` would lose the union of the session statuses
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

/**
 * The browser media sessions of every administrator, whichever browser serves them.
 *
 * Not in the event stream of XO, so polled: the ISOs served by this tab are followed from the tab itself, and a
 * change of the CD drive is a reason to reload it (see `useBrowserMediaCdDrive`).
 */
export const useXoBrowserMediaCollection = defineRemoteResource({
  url: `${BASE_URL}/browser-media?fields=${browserMediaFields.join(',')}`,
  initialData: () => [] as FrontXoBrowserMedia[],
  state: (browserMediaSessions, context) => {
    /** The session whose ISO is inserted in the VM, or being inserted or ejected. */
    function getBrowserMediaByVmId(vmId: XoVm['id']) {
      return browserMediaSessions.value.find(session => session.status !== 'connected' && session.vmId === vmId)
    }

    return {
      ...useXoCollectionState(browserMediaSessions, {
        context,
        baseName: ['browserMedia', 'browserMediaSessions'],
      }),
      getBrowserMediaByVmId,
      reloadBrowserMediaSessions: context.forceReload,
    }
  },
})
