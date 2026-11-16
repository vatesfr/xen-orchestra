import { useBrowserMediaCdDrive } from '@/modules/browser-media/composables/use-browser-media-cd-drive.composable.ts'
import type {
  FrontXoBrowserMedia,
  useXoBrowserMediaCollection,
} from '@/modules/browser-media/remote-resources/use-xo-browser-media-collection.ts'
import {
  type LocalBrowserMedia,
  useBrowserMediaSessionsStore,
} from '@/modules/browser-media/stores/browser-media-sessions.store.ts'
import type { useXoUserCollection } from '@/modules/user/remote-resources/use-xo-user-collection.ts'
import type { FrontXoVbd, useXoVbdCollection } from '@/modules/vbd/remote-resources/use-xo-vbd-collection.ts'
import type { useXoVdiCollection } from '@/modules/vdi/remote-resources/use-xo-vdi-collection.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { createVbd } from '@/test/create-vbd.ts'
import { createVm } from '@/test/create-vm.ts'
import { mountComposable } from '@/test/mount-composable.ts'
import { formatSize } from '@core/utils/size.util.ts'
import { formatDateTime } from '@core/utils/time.util.ts'
import type { XoBrowserMediaSession, XoUser } from '@vates/types'
import { nextTick, ref } from 'vue'
import { useI18n } from 'vue-i18n'

const { getBrowserMediaByVmId, reloadBrowserMediaSessions, getVbdsByIds, getVdiById, getUserById } = vi.hoisted(() => ({
  getBrowserMediaByVmId: vi.fn(),
  reloadBrowserMediaSessions: vi.fn(),
  getVbdsByIds: vi.fn(),
  getVdiById: vi.fn(),
  getUserById: vi.fn(),
}))

vi.mock(import('@/modules/browser-media/remote-resources/use-xo-browser-media-collection.ts'), () => ({
  useXoBrowserMediaCollection: (() => ({
    getBrowserMediaByVmId,
    reloadBrowserMediaSessions,
  })) as unknown as typeof useXoBrowserMediaCollection,
}))

vi.mock(import('@/modules/vbd/remote-resources/use-xo-vbd-collection.ts'), () => ({
  useXoVbdCollection: (() => ({ getVbdsByIds, areVbdsReady: { value: true } })) as unknown as typeof useXoVbdCollection,
}))

vi.mock(import('@/modules/vdi/remote-resources/use-xo-vdi-collection.ts'), () => ({
  useXoVdiCollection: (() => ({ getVdiById })) as unknown as typeof useXoVdiCollection,
}))

vi.mock(import('@/modules/user/remote-resources/use-xo-user-collection.ts'), () => ({
  useXoUserCollection: (() => ({ getUserById })) as unknown as typeof useXoUserCollection,
}))

const SESSION_ID = 'session-1' as XoBrowserMediaSession['id']

const EMPTY_CD_DRIVE = createVbd({ id: 'vbd-cd' as FrontXoVbd['id'], is_cd_drive: true, VDI: undefined })

beforeEach(() => {
  getBrowserMediaByVmId.mockReset()
  reloadBrowserMediaSessions.mockReset().mockResolvedValue(undefined)
  getVbdsByIds.mockReset().mockReturnValue([EMPTY_CD_DRIVE])
  getVdiById.mockReset()
  getUserById.mockReset()
})

function mountCdDrive(vm: FrontXoVm, localSession?: Omit<LocalBrowserMedia, 'vmId'>) {
  return mountComposable(() => {
    const store = useBrowserMediaSessionsStore()

    if (localSession !== undefined) {
      store.localSessions.set(vm.id, { vmId: vm.id, ...localSession })
    }

    return { ...useBrowserMediaCdDrive(vm), store, t: useI18n().t }
  })
}

function createServerSession(overrides: Partial<FrontXoBrowserMedia> = {}) {
  return {
    id: 'session-2',
    name: 'windows.iso',
    size: 4096,
    userId: 'user-2',
    createdAt: 1_700_000_000_000,
    bytesRead: 2048,
    status: 'inserted',
    vmId: 'vm-123',
    vdiId: 'vdi-2',
    insertedAt: 1_700_000_000_000,
    ...overrides,
  } as FrontXoBrowserMedia
}

const createVmWithCdDrive = () => createVm({ $VBDs: [EMPTY_CD_DRIVE.id] as FrontXoVm['$VBDs'] })

describe('servedIso', () => {
  it('is the ISO served by this tab, with its own stats', () => {
    const { wrapper } = mountCdDrive(createVmWithCdDrive(), {
      name: 'debian.iso',
      size: 4096,
      status: 'inserted',
      sessionId: SESSION_ID,
      insertedAt: 1_700_000_000_000,
      bytesRead: 1024,
    })

    expect(wrapper.vm.servedIso).toMatchObject({ isLocal: true, name: 'debian.iso', status: 'inserted-here' })
    expect(wrapper.vm.servedIsoStatus).toBe(wrapper.vm.t('browser-media:status:inserted'))
    expect(wrapper.vm.servedIsoStats).toBe(
      wrapper.vm.t('browser-media:stats', { since: formatDateTime(1_700_000_000_000), size: formatSize(1024, 1) })
    )
  })

  it('is the ISO another browser serves, with the name of its user', () => {
    getBrowserMediaByVmId.mockReturnValue(createServerSession())
    getUserById.mockImplementation((id: XoUser['id']) => (id === 'user-2' ? { name: 'alice' } : undefined))

    const { wrapper } = mountCdDrive(createVmWithCdDrive())

    expect(wrapper.vm.servedIso).toMatchObject({ isLocal: false, name: 'windows.iso', status: 'inserted-elsewhere' })
    expect(wrapper.vm.servedIsoStatus).toBe(wrapper.vm.t('browser-media:served-by-another-browser', { user: 'alice' }))
  })

  it('ignores a session of xo-server this tab already ended', () => {
    getBrowserMediaByVmId.mockReturnValue(createServerSession({ id: SESSION_ID }))

    const vm = createVmWithCdDrive()
    const { wrapper } = mountCdDrive(vm, {
      name: 'debian.iso',
      size: 4096,
      status: 'inserting',
      sessionId: SESSION_ID,
      bytesRead: 0,
    })
    wrapper.vm.store.cancel(vm.id)

    expect(wrapper.vm.servedIso).toBeUndefined()
  })
})

describe('isInserting', () => {
  it('is true until the ISO of this tab is inserted', () => {
    const { wrapper } = mountCdDrive(createVmWithCdDrive(), {
      name: 'debian.iso',
      size: 4096,
      status: 'connecting',
      bytesRead: 0,
    })

    expect(wrapper.vm.isInserting).toBe(true)
  })

  it('is false for an ISO another browser is inserting', () => {
    getBrowserMediaByVmId.mockReturnValue(createServerSession({ status: 'inserting' } as Partial<FrontXoBrowserMedia>))

    const { wrapper } = mountCdDrive(createVmWithCdDrive())

    expect(wrapper.vm.isInserting).toBe(false)
  })
})

describe('errorMessage', () => {
  it('says why the ISO of this tab was ejected', () => {
    const { wrapper } = mountCdDrive(createVmWithCdDrive(), {
      name: 'debian.iso',
      size: 4096,
      status: 'ended',
      bytesRead: 0,
      error: { reason: 'idle' },
    })

    expect(wrapper.vm.errorMessage).toBe(wrapper.vm.t('browser-media:ended:idle', { name: 'debian.iso' }))
  })
})

describe('insertedVdiName', () => {
  it('is the name of an ISO inserted by other means', () => {
    getVbdsByIds.mockReturnValue([createVbd({ is_cd_drive: true, VDI: 'vdi-sr-iso' as FrontXoVbd['VDI'] })])
    getVdiById.mockReturnValue({ name_label: 'ubuntu.iso' })

    const { wrapper } = mountCdDrive(createVmWithCdDrive())

    expect(wrapper.vm.insertedVdiName).toBe('ubuntu.iso')
  })
})

describe('hasCdDrive', () => {
  it('is false for a VM without CD drive', () => {
    getVbdsByIds.mockReturnValue([createVbd({ is_cd_drive: false })])

    const { wrapper } = mountCdDrive(createVmWithCdDrive())

    expect(wrapper.vm.hasCdDrive).toBe(false)
  })
})

describe('reloading the browser media', () => {
  it('happens as soon as the CD drive changes, e.g. as another browser inserts an ISO', async () => {
    const vm = ref(createVmWithCdDrive())
    getVbdsByIds.mockImplementation((ids: string[]) =>
      ids.includes('vbd-cd-filled')
        ? [createVbd({ is_cd_drive: true, VDI: 'vdi-2' as FrontXoVbd['VDI'] })]
        : [EMPTY_CD_DRIVE]
    )

    mountComposable(() => useBrowserMediaCdDrive(vm))
    vm.value = createVm({ $VBDs: ['vbd-cd-filled'] as FrontXoVm['$VBDs'] })
    await nextTick()

    expect(reloadBrowserMediaSessions).toHaveBeenCalled()
  })
})
