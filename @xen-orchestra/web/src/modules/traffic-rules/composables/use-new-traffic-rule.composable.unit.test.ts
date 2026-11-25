import NewTrafficRuleDrawer from '@/modules/traffic-rules/components/drawer/NewTrafficRuleDrawer.vue'
import { useNewTrafficRule } from '@/modules/traffic-rules/composables/use-new-traffic-rule.composable.ts'
import {
  type TrafficRulePayload,
  useXoTrafficRuleCreateJob,
} from '@/modules/traffic-rules/jobs/xo-traffic-rule-create.job.ts'
import { createJobStub } from '@/test/create-job-result.ts'
import { createPool } from '@/test/create-pool.ts'
import { createVif } from '@/test/create-vif.ts'
import { overlayMock, mockOverlay } from '@/test/mock-overlay.ts'
import { mountComposable } from '@/test/mount-composable.ts'
import { silenceConsoleError } from '@/test/silence-console-error.ts'
import type { Component, Ref } from 'vue'

type OverlayOptions = {
  component: () => Promise<{ default: Component }>
  events: {
    onConfirm: (payload: TrafficRulePayload) => unknown
    onCancel: true
  }
}

const createJob = createJobStub(useXoTrafficRuleCreateJob)
const { run } = createJob

mockOverlay()

const POOL = createPool()

const VIF = createVif({ $pool: POOL.id })

const PAYLOAD: TrafficRulePayload = {
  targetType: 'VIF',
  targetId: VIF.id,
  allow: true,
  direction: 'from',
  protocol: 'TCP',
  ipRange: '10.0.0.1',
  port: 80,
}

beforeEach(() => {
  createJob.reset()
  overlayMock.reset()

  silenceConsoleError()
})

function mountNewTrafficRule(vifId?: typeof VIF.id) {
  return mountComposable(() => useNewTrafficRule(POOL.id, vifId)).wrapper.vm
}

function getJobPayload() {
  return (createJob.use.mock.calls[0] as [Ref<TrafficRulePayload | undefined>])[0]
}

function getOverlay() {
  return overlayMock.getOverlay<OverlayOptions>()
}

describe('isCreatingTrafficRule', () => {
  it('is true while the creation runs', () => {
    createJob.setState({ isRunning: true })

    expect(mountNewTrafficRule().isCreatingTrafficRule).toBe(true)
  })
})

describe('openNewTrafficRuleDrawer', () => {
  it('opens the traffic rule drawer on the pool', async () => {
    mountNewTrafficRule().openNewTrafficRuleDrawer()

    expect((await getOverlay().component()).default).toBe(NewTrafficRuleDrawer)
    expect(getOverlay().open.mock.lastCall?.[0].props).toEqual({ poolId: POOL.id, vifId: undefined })
  })

  it('opens the traffic rule drawer on the VIF', () => {
    mountNewTrafficRule(VIF.id).openNewTrafficRuleDrawer()

    expect(getOverlay().open.mock.lastCall?.[0].props).toEqual({ poolId: POOL.id, vifId: VIF.id })
  })
})

describe('onConfirm', () => {
  it('has no payload before the drawer is confirmed', () => {
    mountNewTrafficRule()

    expect(getJobPayload().value).toBeUndefined()
  })

  it('closes the drawer when it is cancelled', () => {
    mountNewTrafficRule()

    expect(getOverlay().events.onCancel).toBe(true)
  })

  it('runs the job in the background with the confirmed payload, and closes the drawer', () => {
    run.mockImplementation(() => {
      expect(getJobPayload().value).toEqual(PAYLOAD)
    })
    mountNewTrafficRule().openNewTrafficRuleDrawer()

    const response = getOverlay().events.onConfirm(PAYLOAD)

    expect(run).toHaveBeenCalledExactlyOnceWith({ detached: true, onSuccess: expect.any(Function) })
    expect(response).toBeUndefined()
  })

  it('logs the failure when the creation is rejected', () => {
    const consoleError = silenceConsoleError()
    run.mockImplementation(({ onSuccess }: { onSuccess: (results: PromiseSettledResult<unknown>[]) => void }) => {
      onSuccess([{ status: 'rejected', reason: new Error('Creation failed') }])
    })
    mountNewTrafficRule().openNewTrafficRuleDrawer()

    getOverlay().events.onConfirm(PAYLOAD)

    expect(consoleError).toHaveBeenCalledWith('Failed to create traffic rule', new Error('Creation failed'))
  })
})
