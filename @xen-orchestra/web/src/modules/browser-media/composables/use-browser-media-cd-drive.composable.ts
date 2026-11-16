import { useXoBrowserMediaCollection } from '@/modules/browser-media/remote-resources/use-xo-browser-media-collection.ts'
import {
  type LocalBrowserMediaErrorReason,
  useBrowserMediaSessionsStore,
} from '@/modules/browser-media/stores/browser-media-sessions.store.ts'
import { useXoUserCollection } from '@/modules/user/remote-resources/use-xo-user-collection.ts'
import { useXoVdiCollection } from '@/modules/vdi/remote-resources/use-xo-vdi-collection.ts'
import { useXoVmVbdsUtils } from '@/modules/vm/composables/xo-vm-vbd-utils.composable.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { useMapper } from '@core/packages/mapper'
import { formatSize } from '@core/utils/size.util.ts'
import { formatDateTime } from '@core/utils/time.util.ts'
import { toComputed } from '@core/utils/to-computed.util.ts'
import type { XoUser, XoVdi } from '@vates/types'
import { useIntervalFn } from '@vueuse/core'
import { computed, type MaybeRefOrGetter, watch } from 'vue'
import { useI18n } from 'vue-i18n'

// how often a session xo-server is inserting or ejecting is reloaded: it settles within seconds
const SETTLING_RELOAD_INTERVAL_MS = 2_000

type ServedIsoStatus = 'connecting' | 'inserting' | 'inserted-here' | 'inserted-elsewhere' | 'ejecting'

/** An ISO streamed from a browser into the CD drive of the VM: by this tab, or by another one. */
export type ServedIso = {
  isLocal: boolean
  name: string
  status: ServedIsoStatus
  /** Set once inserted */
  insertedAt?: number
  bytesRead: number
  /** Whose browser serves it, when it is not this tab */
  userId?: XoUser['id']
}

/**
 * What the CD drive of `vm` holds, as shown by its card.
 */
export function useBrowserMediaCdDrive(rawVm: MaybeRefOrGetter<FrontXoVm>) {
  const vm = toComputed(rawVm)

  const { t } = useI18n()

  const sessionsStore = useBrowserMediaSessionsStore()
  const { getBrowserMediaByVmId, reloadBrowserMediaSessions } = useXoBrowserMediaCollection()
  const { areVmVbdsReady, cdDriveVbds } = useXoVmVbdsUtils(vm)
  const { getVdiById } = useXoVdiCollection()
  const { getUserById } = useXoUserCollection()

  const localSession = computed(() => sessionsStore.getLocalSession(vm.value.id))

  // as seen by xo-server, whichever browser serves it, unless this tab ended it since xo-server was last asked
  const serverSession = computed(() => {
    const session = getBrowserMediaByVmId(vm.value.id)

    return session === undefined || sessionsStore.hasEnded(session.id) ? undefined : session
  })

  const insertedVdiId = computed(() => cdDriveVbds.value.find(vbd => vbd.VDI !== undefined)?.VDI)

  const insertedVdiName = computed(() => {
    const vdiId = insertedVdiId.value

    return vdiId === undefined ? undefined : (getVdiById(vdiId as XoVdi['id'])?.name_label ?? vdiId)
  })

  // the browser media are polled: reloaded as soon as they may have changed, when a session of this tab changes, or
  // when the CD drive does, e.g. as another tab inserts an ISO (the drives are in the event stream)
  function reload() {
    reloadBrowserMediaSessions().catch(error => console.error('Failed to reload the browser media:', error))
  }

  watch([() => localSession.value?.status, insertedVdiId], reload)

  // e.g. the CD drive is already empty while xo-server still releases the ISO: followed until it is over
  const { pause, resume } = useIntervalFn(reload, SETTLING_RELOAD_INTERVAL_MS, { immediate: false })

  watch(
    () => serverSession.value?.status === 'inserting' || serverSession.value?.status === 'ejecting',
    isSettling => (isSettling ? resume() : pause()),
    { immediate: true }
  )

  const servedIso = computed((): ServedIso | undefined => {
    const local = localSession.value

    if (local !== undefined && local.status !== 'ended') {
      return {
        isLocal: true,
        name: local.name,
        status: local.status === 'inserted' ? 'inserted-here' : local.status,
        insertedAt: local.insertedAt,
        bytesRead: local.bytesRead,
      }
    }

    const server = serverSession.value

    if (server === undefined || server.status === 'connected') {
      return undefined
    }

    return {
      isLocal: false,
      name: server.name,
      status: server.status === 'inserted' ? 'inserted-elsewhere' : server.status,
      insertedAt: server.insertedAt,
      bytesRead: server.bytesRead,
      userId: server.userId,
    }
  })

  /** While it can still be cancelled */
  const isInserting = computed(
    () =>
      servedIso.value?.isLocal === true &&
      (servedIso.value.status === 'connecting' || servedIso.value.status === 'inserting')
  )

  const servedIsoStatus = useMapper<ServedIsoStatus, string>(
    () => servedIso.value?.status,
    () => {
      const userId = servedIso.value?.userId

      return {
        connecting: t('browser-media:status:connecting'),
        inserting: t('browser-media:status:inserting'),
        'inserted-here': t('browser-media:status:inserted'),
        'inserted-elsewhere': t('browser-media:served-by-another-browser', {
          user: userId === undefined ? '' : (getUserById(userId)?.name ?? userId),
        }),
        ejecting: t('browser-media:status:ejecting'),
      }
    },
    'connecting'
  )

  const servedIsoStats = computed(() => {
    const iso = servedIso.value

    if (iso?.insertedAt === undefined) {
      return undefined
    }

    return t('browser-media:stats', { since: formatDateTime(iso.insertedAt), size: formatSize(iso.bytesRead, 1) })
  })

  /** Why the last session of this tab ended, until dismissed */
  const errorMessage = useMapper<LocalBrowserMediaErrorReason, string>(
    () => localSession.value?.error?.reason,
    () => {
      const name = localSession.value?.name

      return {
        'bad-power-state': t('browser-media:ended:bad-power-state', { name }),
        'cd-drive-requires-halted-vm': t('browser-media:ended:cd-drive-requires-halted-vm', { name }),
        'cd-not-empty': t('browser-media:ended:cd-not-empty', { name }),
        'eject-failed': t('browser-media:ended:eject-failed', { name }),
        ejected: t('browser-media:ended:ejected', { name }),
        'high-availability': t('browser-media:ended:high-availability', { name }),
        idle: t('browser-media:ended:idle', { name }),
        lost: t('browser-media:ended:lost', { name }),
        protocol: t('browser-media:ended:protocol', { name }),
        'read-failed': t('browser-media:ended:read-failed', { name }),
        unavailable: t('browser-media:ended:unavailable', { name }),
        unknown: t('browser-media:ended:unknown', { name }),
      }
    },
    'unknown'
  )

  return {
    localSession,
    servedIso,
    servedIsoStatus,
    servedIsoStats,
    isInserting,
    errorMessage,
    insertedVdiId,
    insertedVdiName,
    areVmVbdsReady,
    hasCdDrive: computed(() => cdDriveVbds.value.length > 0),
  }
}
