import { useNewProxy } from '@/modules/appliance/composables/use-new-proxy.composable.ts'
import { useXoaProxySetJob } from '@/modules/appliance/jobs/xoa-proxy-set.job.ts'
import { useXoaProxy } from '@/modules/appliance/remote-resources/use-xoa-proxy.ts'
import type { XoaProxyPayload } from '@/modules/appliance/types/xoa-proxy.type.ts'
import { createJobStub } from '@/test/create-job-result.ts'
import { mockOverlay, overlayMock } from '@/test/mock-overlay.ts'
import { mountComposable } from '@/test/mount-composable.ts'
import { silenceConsoleError } from '@/test/silence-console-error.ts'
import { mockedExport } from '@/test/spy-on-module.ts'
import { KEEP_OVERLAY_OPEN } from '@core/packages/overlay/symbols.ts'
import type { Ref } from 'vue'

type NewProxyDrawerOverlay = {
  events: {
    onConfirm: (payload: XoaProxyPayload) => Promise<unknown>
    onCancel: true
  }
}

const setJob = createJobStub(useXoaProxySetJob)

const proxyResource = mockedExport(useXoaProxy)

const reloadProxy = vi.fn()

mockOverlay()

const PAYLOAD: XoaProxyPayload = { host: 'proxy.example.org', port: 3128, username: 'admin', password: 'secret' }

beforeEach(() => {
  setJob.reset()
  overlayMock.reset()

  reloadProxy.mockReset()
  reloadProxy.mockResolvedValue(undefined)
  proxyResource.mockReturnValue({ reloadProxy })

  silenceConsoleError()
})

function mountNewProxy() {
  return mountComposable(() => useNewProxy()).wrapper.vm
}

function getDrawer() {
  return overlayMock.getOverlay<NewProxyDrawerOverlay>()
}

function findSetPayload() {
  const [payload] = setJob.use.mock.calls[0] as [Ref<XoaProxyPayload | undefined>]

  return payload.value
}

describe('job', () => {
  it('exposes whether the proxy is being added', () => {
    setJob.setState({ isRunning: true })

    expect(mountNewProxy().isAddingProxy).toBe(true)
  })
})

describe('openNewProxyDrawer', () => {
  it('opens the drawer', () => {
    mountNewProxy().openNewProxyDrawer()

    expect(getDrawer().open).toHaveBeenCalledOnce()
  })
})

describe('drawer', () => {
  it('has no payload before the drawer is confirmed', () => {
    mountNewProxy()

    expect(findSetPayload()).toBeUndefined()
  })

  it('closes the drawer when it is cancelled', () => {
    mountNewProxy()

    expect(getDrawer().events.onCancel).toBe(true)
  })

  it('saves the confirmed proxy, reloads it, then closes the drawer', async () => {
    setJob.run.mockImplementation(async () => expect(findSetPayload()).toEqual(PAYLOAD))
    mountNewProxy()

    const response = await getDrawer().events.onConfirm(PAYLOAD)

    expect(setJob.run).toHaveBeenCalledOnce()
    expect(reloadProxy).toHaveBeenCalledOnce()
    expect(response).toBeUndefined()
  })

  it('keeps the drawer open without reloading the proxy when the save fails', async () => {
    setJob.run.mockRejectedValue(new Error('invalid proxy'))
    mountNewProxy()

    const response = await getDrawer().events.onConfirm(PAYLOAD)

    expect(response).toBe(KEEP_OVERLAY_OPEN)
    expect(reloadProxy).not.toHaveBeenCalled()
  })
})
