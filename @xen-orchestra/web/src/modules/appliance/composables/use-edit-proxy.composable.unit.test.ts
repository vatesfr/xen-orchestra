import { useEditProxy } from '@/modules/appliance/composables/use-edit-proxy.composable.ts'
import { useXoaProxyRemoveJob } from '@/modules/appliance/jobs/xoa-proxy-remove.job.ts'
import { useXoaProxySetJob } from '@/modules/appliance/jobs/xoa-proxy-set.job.ts'
import { useXoaProxy } from '@/modules/appliance/remote-resources/use-xoa-proxy.ts'
import type { XoaProxy, XoaProxyPayload } from '@/modules/appliance/types/xoa-proxy.type.ts'
import { createJobStub } from '@/test/create-job-result.ts'
import { mockOverlay, overlayMock } from '@/test/mock-overlay.ts'
import { mountComposable } from '@/test/mount-composable.ts'
import { silenceConsoleError } from '@/test/silence-console-error.ts'
import { mockedExport } from '@/test/spy-on-module.ts'
import { KEEP_OVERLAY_OPEN } from '@core/packages/overlay/symbols.ts'
import type { Ref } from 'vue'

type RemoveModalOverlay = {
  events: { onConfirm: () => Promise<unknown> }
}

type EditDrawerOverlay = {
  events: {
    onConfirm: (payload: XoaProxyPayload) => Promise<unknown>
    onRemove: () => Promise<unknown>
    onCancel: true
  }
}

const setJob = createJobStub(useXoaProxySetJob)

const removeJob = createJobStub(useXoaProxyRemoveJob)

const proxyResource = mockedExport(useXoaProxy)

const reloadProxy = vi.fn()

mockOverlay()

const PROXY: XoaProxy = { host: 'proxy.example.org', port: 3128, username: 'admin' }

const PAYLOAD: XoaProxyPayload = { host: 'new-proxy.example.org', port: 8080, password: 'secret' }

beforeEach(() => {
  setJob.reset()
  removeJob.reset()
  overlayMock.reset()

  reloadProxy.mockReset()
  reloadProxy.mockResolvedValue(undefined)
  proxyResource.mockReturnValue({ reloadProxy })

  silenceConsoleError()
})

function mountEditProxy(proxy: XoaProxy = PROXY) {
  return mountComposable(() => useEditProxy(proxy)).wrapper.vm
}

// The remove modal is defined first, so the drawer can open it
function getRemoveModal() {
  return overlayMock.getOverlay<RemoveModalOverlay>(0)
}

function getEditDrawer() {
  return overlayMock.getOverlay<EditDrawerOverlay>(1)
}

function findSetPayload() {
  const [payload] = setJob.use.mock.calls[0] as [Ref<XoaProxyPayload | undefined>]

  return payload.value
}

describe('job', () => {
  it('exposes whether the proxy is being edited or removed', () => {
    setJob.setState({ isRunning: true })
    removeJob.setState({ isRunning: true })

    const result = mountEditProxy()

    expect(result.isEditingProxy).toBe(true)
    expect(result.isRemovingProxy).toBe(true)
  })
})

describe('openEditProxyDrawer', () => {
  it('opens the drawer with the proxy', () => {
    mountEditProxy().openEditProxyDrawer()

    expect(getEditDrawer().open).toHaveBeenCalledWith({ props: expect.objectContaining({ proxy: PROXY }) })
  })
})

describe('drawer', () => {
  it('has no payload before the drawer is confirmed', () => {
    mountEditProxy()

    expect(findSetPayload()).toBeUndefined()
  })

  it('closes the drawer when it is cancelled', () => {
    mountEditProxy()

    expect(getEditDrawer().events.onCancel).toBe(true)
  })

  it('saves the confirmed proxy, reloads it, then closes the drawer', async () => {
    setJob.run.mockImplementation(async () => expect(findSetPayload()).toEqual(PAYLOAD))
    mountEditProxy()

    const response = await getEditDrawer().events.onConfirm(PAYLOAD)

    expect(setJob.run).toHaveBeenCalledOnce()
    expect(reloadProxy).toHaveBeenCalledOnce()
    expect(response).toBeUndefined()
  })

  it('keeps the drawer open without reloading the proxy when the save fails', async () => {
    setJob.run.mockRejectedValue(new Error('invalid proxy'))
    mountEditProxy()

    const response = await getEditDrawer().events.onConfirm(PAYLOAD)

    expect(response).toBe(KEEP_OVERLAY_OPEN)
    expect(reloadProxy).not.toHaveBeenCalled()
  })
})

describe('remove', () => {
  it('reloads the proxy and closes the drawer once the removal is confirmed', async () => {
    mountEditProxy()
    getRemoveModal().open.mockResolvedValue({ event: 'onConfirm' })

    const response = await getEditDrawer().events.onRemove()

    expect(getRemoveModal().open).toHaveBeenCalledOnce()
    expect(reloadProxy).toHaveBeenCalledOnce()
    expect(response).toBeUndefined()
  })

  it('keeps the drawer open when the removal is cancelled', async () => {
    mountEditProxy()
    getRemoveModal().open.mockResolvedValue({ event: 'onCancel' })

    const response = await getEditDrawer().events.onRemove()

    expect(response).toBe(KEEP_OVERLAY_OPEN)
    expect(reloadProxy).not.toHaveBeenCalled()
  })

  it('removes the proxy when the modal is confirmed, then closes it', async () => {
    mountEditProxy()

    const response = await getRemoveModal().events.onConfirm()

    expect(removeJob.run).toHaveBeenCalledOnce()
    expect(response).toBeUndefined()
  })

  it('keeps the modal open when the removal fails', async () => {
    removeJob.run.mockRejectedValue(new Error('proxy not removed'))
    mountEditProxy()

    const response = await getRemoveModal().events.onConfirm()

    expect(response).toBe(KEEP_OVERLAY_OPEN)
  })
})
