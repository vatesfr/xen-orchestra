import VmDuplicateDrawer from '@/modules/vm/components/drawer/VmDuplicateDrawer.vue'
import { useVmDuplicate } from '@/modules/vm/composables/use-vm-duplicate.composable.ts'
import { type DuplicateVmPayload, useXoVmDuplicateJob } from '@/modules/vm/jobs/xo-vm-duplicate.job.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { createJobStub } from '@/test/create-job-result.ts'
import { createVm } from '@/test/create-vm.ts'
import { overlayMock, mockOverlay } from '@/test/mock-overlay.ts'
import { mountComposable } from '@/test/mount-composable.ts'
import { type Component, type MaybeRefOrGetter, type Ref, toValue } from 'vue'

type OverlayOptions = {
  component: () => Promise<{ default: Component }>
  events: {
    onConfirm: (payload: DuplicateVmPayload) => unknown
    onCancel: true
  }
}

const createJob = createJobStub(useXoVmDuplicateJob)
const { run } = createJob

mockOverlay()

const VM = createVm()

const PAYLOAD: DuplicateVmPayload = { name_label: 'Test VM_COPY', fast: true }

beforeEach(() => {
  createJob.reset()
  overlayMock.reset()
})

function mountVmDuplicate() {
  return mountComposable(() => useVmDuplicate(VM)).wrapper.vm
}

function getJobArgs() {
  const [vm, payload] = createJob.use.mock.calls[0] as [
    MaybeRefOrGetter<FrontXoVm>,
    Ref<DuplicateVmPayload | undefined>,
  ]

  return { vm: toValue(vm), payload }
}

function getOverlay() {
  return overlayMock.getOverlay<OverlayOptions>()
}

it('runs on the VM', () => {
  mountVmDuplicate()

  expect(getJobArgs().vm).toEqual(VM)
})

describe('canDuplicateVm', () => {
  it('is false when the duplication cannot run', () => {
    createJob.setState({ canRun: false })

    expect(mountVmDuplicate().canDuplicateVm).toBe(false)
  })
})

describe('isDuplicatingVm', () => {
  it('is true while the duplication runs', () => {
    createJob.setState({ isRunning: true })

    expect(mountVmDuplicate().isDuplicatingVm).toBe(true)
  })
})

describe('duplicateVm', () => {
  it('opens the duplication drawer on the VM', async () => {
    mountVmDuplicate().duplicateVm()

    expect((await getOverlay().component()).default).toBe(VmDuplicateDrawer)
    expect(getOverlay().open.mock.lastCall?.[0].props).toEqual({ vm: VM })
  })
})

describe('onConfirm', () => {
  it('has no payload before the drawer is confirmed', () => {
    mountVmDuplicate()

    expect(getJobArgs().payload.value).toBeUndefined()
  })

  it('closes the drawer when it is cancelled', () => {
    mountVmDuplicate()

    expect(getOverlay().events.onCancel).toBe(true)
  })

  it('runs the job in the background with the confirmed payload, and closes the drawer', () => {
    run.mockImplementation(() => {
      expect(getJobArgs().payload.value).toEqual(PAYLOAD)
    })
    mountVmDuplicate().duplicateVm()

    const response = getOverlay().events.onConfirm(PAYLOAD)

    expect(run).toHaveBeenCalledExactlyOnceWith({ detached: true })
    expect(response).toBeUndefined()
  })
})
