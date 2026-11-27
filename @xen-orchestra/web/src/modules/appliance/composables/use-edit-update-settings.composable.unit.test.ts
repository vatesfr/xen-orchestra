import { useEditUpdateSettings } from '@/modules/appliance/composables/use-edit-update-settings.composable.ts'
import {
  type EditUpdateSettingsPayload,
  useXoaUpdateSettingsEditJob,
} from '@/modules/appliance/jobs/xoa-update-settings-edit.job.ts'
import { useXoaPackages } from '@/modules/appliance/remote-resources/use-xoa-packages.ts'
import { useXoaUpdateChannel } from '@/modules/appliance/remote-resources/use-xoa-update-channel.ts'
import { createJobStub } from '@/test/create-job-result.ts'
import { mockOverlay, overlayMock } from '@/test/mock-overlay.ts'
import { mountComposable } from '@/test/mount-composable.ts'
import { silenceConsoleError } from '@/test/silence-console-error.ts'
import { mockedExport } from '@/test/spy-on-module.ts'
import { KEEP_OVERLAY_OPEN } from '@core/packages/overlay/symbols.ts'
import { type Ref, ref } from 'vue'

type EditUpdateSettingsDrawerOverlay = {
  events: {
    onConfirm: (payload: EditUpdateSettingsPayload) => Promise<unknown>
    onCancel: true
  }
}

const editJob = createJobStub(useXoaUpdateSettingsEditJob)

const channelResource = mockedExport(useXoaUpdateChannel)

const packagesResource = mockedExport(useXoaPackages)

const reloadChannel = vi.fn()

const checkUpdates = vi.fn()

mockOverlay()

const PAYLOAD: EditUpdateSettingsPayload = { channel: 'latest', dailyCheck: true }

beforeEach(() => {
  editJob.reset()
  overlayMock.reset()

  reloadChannel.mockReset()
  reloadChannel.mockResolvedValue(undefined)
  channelResource.mockReturnValue({ channel: ref('stable'), reloadChannel })

  checkUpdates.mockReset()
  checkUpdates.mockResolvedValue(undefined)
  packagesResource.mockReturnValue({ checkUpdates })

  silenceConsoleError()
})

function mountEditUpdateSettings() {
  return mountComposable(() => useEditUpdateSettings()).wrapper.vm
}

function getDrawer() {
  return overlayMock.getOverlay<EditUpdateSettingsDrawerOverlay>()
}

function findEditPayload() {
  const [payload] = editJob.use.mock.calls[0] as [Ref<EditUpdateSettingsPayload | undefined>]

  return payload.value
}

describe('job', () => {
  it('exposes whether the update settings are being edited', () => {
    editJob.setState({ isRunning: true })

    expect(mountEditUpdateSettings().isEditingUpdateSettings).toBe(true)
  })
})

describe('openEditUpdateSettingsDrawer', () => {
  it('opens the drawer with the current channel', () => {
    mountEditUpdateSettings().openEditUpdateSettingsDrawer()

    expect(getDrawer().open).toHaveBeenCalledWith({ props: expect.objectContaining({ channel: 'stable' }) })
  })
})

describe('drawer', () => {
  it('has no payload before the drawer is confirmed', () => {
    mountEditUpdateSettings()

    expect(findEditPayload()).toBeUndefined()
  })

  it('closes the drawer when it is cancelled', () => {
    mountEditUpdateSettings()

    expect(getDrawer().events.onCancel).toBe(true)
  })

  it('saves the confirmed settings, reloads the channel and checks the updates, then closes the drawer', async () => {
    editJob.run.mockImplementation(async () => expect(findEditPayload()).toEqual(PAYLOAD))
    mountEditUpdateSettings()

    const response = await getDrawer().events.onConfirm(PAYLOAD)

    expect(editJob.run).toHaveBeenCalledOnce()
    expect(reloadChannel).toHaveBeenCalledOnce()
    expect(checkUpdates).toHaveBeenCalledOnce()
    expect(response).toBeUndefined()
  })

  it('closes the drawer without waiting for the update check', async () => {
    checkUpdates.mockReturnValue(new Promise(() => {}))
    mountEditUpdateSettings()

    const response = await getDrawer().events.onConfirm(PAYLOAD)

    expect(response).toBeUndefined()
  })

  it('keeps the drawer open without reloading anything when the save fails', async () => {
    editJob.run.mockRejectedValue(new Error('unknown channel'))
    mountEditUpdateSettings()

    const response = await getDrawer().events.onConfirm(PAYLOAD)

    expect(response).toBe(KEEP_OVERLAY_OPEN)
    expect(reloadChannel).not.toHaveBeenCalled()
    expect(checkUpdates).not.toHaveBeenCalled()
  })
})
