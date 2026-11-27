import { useRegisterAppliance } from '@/modules/appliance/composables/use-register-appliance.composable.ts'
import { type RegisterAppliancePayload, useXoaRegisterJob } from '@/modules/appliance/jobs/xoa-register.job.ts'
import { createApiError } from '@/test/create-api-error.ts'
import { createJobStub } from '@/test/create-job-result.ts'
import { mockOverlay, overlayMock } from '@/test/mock-overlay.ts'
import { mountComposable } from '@/test/mount-composable.ts'
import { silenceConsoleError } from '@/test/silence-console-error.ts'
import { KEEP_OVERLAY_OPEN } from '@core/packages/overlay/symbols.ts'
import { HttpCodes } from '@core/types/http-codes.type.ts'
import type { Ref } from 'vue'

type RegisterDrawerOverlay = {
  events: {
    onConfirm: (payload: RegisterAppliancePayload) => Promise<unknown>
    onCancel: true
  }
}

const registerJob = createJobStub(useXoaRegisterJob)

mockOverlay()

const PAYLOAD: RegisterAppliancePayload = { email: 'admin@example.org', password: 'secret' }

beforeEach(() => {
  registerJob.reset()
  overlayMock.reset()

  silenceConsoleError()
})

function mountRegisterAppliance(options?: { renew: boolean }) {
  return mountComposable(() => useRegisterAppliance(options)).wrapper.vm
}

function getDrawer() {
  return overlayMock.getOverlay<RegisterDrawerOverlay>()
}

// The reactive props the drawer was opened with
function findDrawerProps() {
  return getDrawer().open.mock.lastCall?.[0].props as { wrongCredentials: boolean }
}

function findRegisterPayload() {
  const [payload] = registerJob.use.mock.calls[0] as [Ref<RegisterAppliancePayload | undefined>]

  return payload.value
}

describe('job', () => {
  it('exposes whether the appliance is being registered', () => {
    registerJob.setState({ isRunning: true })

    expect(mountRegisterAppliance().isRegistering).toBe(true)
  })
})

describe('openRegisterApplianceDrawer', () => {
  it('opens the drawer without wrong credentials', () => {
    mountRegisterAppliance().openRegisterApplianceDrawer()

    expect(findDrawerProps().wrongCredentials).toBe(false)
  })

  it('forgets the wrong credentials of a previous opening', async () => {
    registerJob.run.mockRejectedValue(createApiError(HttpCodes.Unauthorized))
    const result = mountRegisterAppliance()
    result.openRegisterApplianceDrawer()
    await getDrawer().events.onConfirm(PAYLOAD)

    result.openRegisterApplianceDrawer()

    expect(findDrawerProps().wrongCredentials).toBe(false)
  })
})

describe('drawer', () => {
  it('has no payload before the drawer is confirmed', () => {
    mountRegisterAppliance()

    expect(findRegisterPayload()).toBeUndefined()
  })

  it('closes the drawer when it is cancelled', () => {
    mountRegisterAppliance()

    expect(getDrawer().events.onCancel).toBe(true)
  })

  it('registers with the confirmed credentials, then closes the drawer', async () => {
    registerJob.run.mockImplementation(async () => expect(findRegisterPayload()).toEqual({ ...PAYLOAD, renew: false }))
    mountRegisterAppliance()

    const response = await getDrawer().events.onConfirm(PAYLOAD)

    expect(registerJob.run).toHaveBeenCalledOnce()
    expect(response).toBeUndefined()
  })

  it('replaces the current registration when asked to renew it', async () => {
    registerJob.run.mockImplementation(async () => expect(findRegisterPayload()).toEqual({ ...PAYLOAD, renew: true }))
    mountRegisterAppliance({ renew: true })

    await getDrawer().events.onConfirm(PAYLOAD)

    expect(registerJob.run).toHaveBeenCalledOnce()
  })

  it('keeps the drawer open and shows the wrong credentials when the API answers 401', async () => {
    registerJob.run.mockRejectedValue(createApiError(HttpCodes.Unauthorized))
    mountRegisterAppliance().openRegisterApplianceDrawer()

    const response = await getDrawer().events.onConfirm(PAYLOAD)

    expect(response).toBe(KEEP_OVERLAY_OPEN)
    expect(findDrawerProps().wrongCredentials).toBe(true)
  })

  it('keeps the drawer open without wrong credentials when the registration fails otherwise', async () => {
    registerJob.run.mockRejectedValue(createApiError(HttpCodes.InternalServerError))
    mountRegisterAppliance().openRegisterApplianceDrawer()

    const response = await getDrawer().events.onConfirm(PAYLOAD)

    expect(response).toBe(KEEP_OVERLAY_OPEN)
    expect(findDrawerProps().wrongCredentials).toBe(false)
  })

  it('forgets the wrong credentials when the drawer is confirmed again', async () => {
    registerJob.run.mockRejectedValueOnce(createApiError(HttpCodes.Unauthorized))
    mountRegisterAppliance().openRegisterApplianceDrawer()
    await getDrawer().events.onConfirm(PAYLOAD)

    registerJob.run.mockReturnValue(new Promise(() => {}))
    void getDrawer().events.onConfirm(PAYLOAD)

    expect(findDrawerProps().wrongCredentials).toBe(false)
  })
})
