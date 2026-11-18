import { useVmResume } from '@/modules/vm/composables/use-vm-resume.composable.ts'
import type { useXoVmResumeJob } from '@/modules/vm/jobs/xo-vm-resume.job.ts'
import type { useXoVmUnpauseJob } from '@/modules/vm/jobs/xo-vm-unpause.job.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { createJobResult } from '@/test/create-job-result.ts'
import { createVm } from '@/test/create-vm.ts'
import { t } from '@/test/i18n.ts'
import { mountComposable } from '@/test/mount-composable.ts'
import { VM_POWER_STATE } from '@vates/types'
import { type MaybeRefOrGetter, ref, toValue } from 'vue'

const { unpause, resume, useUnpauseJob, useResumeJob } = vi.hoisted(() => ({
  unpause: vi.fn(),
  resume: vi.fn(),
  useUnpauseJob: vi.fn(),
  useResumeJob: vi.fn(),
}))

// The jobs call the REST API and subscribe to server events
vi.mock(import('@/modules/vm/jobs/xo-vm-unpause.job.ts'), () => ({
  useXoVmUnpauseJob: useUnpauseJob as unknown as typeof useXoVmUnpauseJob,
}))

vi.mock(import('@/modules/vm/jobs/xo-vm-resume.job.ts'), () => ({
  useXoVmResumeJob: useResumeJob as unknown as typeof useXoVmResumeJob,
}))

beforeEach(() => {
  unpause.mockReset()
  resume.mockReset()
  useUnpauseJob.mockReset().mockReturnValue(createJobResult(unpause))
  useResumeJob.mockReset().mockReturnValue(createJobResult(resume))
})

const pausedVm = createVm({ id: 'vm-paused' as FrontXoVm['id'], power_state: VM_POWER_STATE.PAUSED })
const suspendedVm = createVm({ id: 'vm-suspended' as FrontXoVm['id'], power_state: VM_POWER_STATE.SUSPENDED })
const runningVm = createVm({ id: 'vm-running' as FrontXoVm['id'], power_state: VM_POWER_STATE.RUNNING })

function mountResume(vms: MaybeRefOrGetter<FrontXoVm[]>) {
  return mountComposable(() => useVmResume(vms)).wrapper.vm
}

function getJobVmIds(useJob: typeof useUnpauseJob) {
  return toValue(useJob.mock.calls[0][0] as MaybeRefOrGetter<FrontXoVm[]>).map(vm => vm.id)
}

describe('resumeVms', () => {
  it('unpauses the paused VMs and resumes the suspended ones', () => {
    const result = mountResume([pausedVm, suspendedVm])

    result.resumeVms()

    expect(getJobVmIds(useUnpauseJob)).toEqual([pausedVm.id])
    expect(getJobVmIds(useResumeJob)).toEqual([suspendedVm.id])
    expect(unpause).toHaveBeenCalledOnce()
    expect(resume).toHaveBeenCalledOnce()
  })

  it('leaves the VMs neither paused nor suspended untouched', () => {
    mountResume([pausedVm, runningVm, suspendedVm])

    expect(getJobVmIds(useUnpauseJob)).toEqual([pausedVm.id])
    expect(getJobVmIds(useResumeJob)).toEqual([suspendedVm.id])
  })

  it('only unpauses when every VM is paused', () => {
    mountResume([pausedVm]).resumeVms()

    expect(unpause).toHaveBeenCalledOnce()
    expect(resume).not.toHaveBeenCalled()
  })

  it('only resumes when every VM is suspended', () => {
    mountResume([suspendedVm]).resumeVms()

    expect(unpause).not.toHaveBeenCalled()
    expect(resume).toHaveBeenCalledOnce()
  })

  it('follows the VMs when they change', () => {
    const vms = ref([pausedVm])
    const result = mountResume(vms)

    vms.value = [suspendedVm]

    result.resumeVms()

    expect(getJobVmIds(useUnpauseJob)).toEqual([])
    expect(getJobVmIds(useResumeJob)).toEqual([suspendedVm.id])
    expect(unpause).not.toHaveBeenCalled()
    expect(resume).toHaveBeenCalledOnce()
  })
})

describe('canResumeVms', () => {
  it('allows resuming paused and suspended VMs', () => {
    const result = mountResume([pausedVm, suspendedVm])

    expect(result.canResumeVms).toBe(true)
    expect(result.resumeVmsErrorMessage).toBeUndefined()
  })

  it('forbids resuming without VMs', () => {
    const result = mountResume([])

    expect(result.canResumeVms).toBe(false)
    expect(result.resumeVmsErrorMessage).toBe(t('job:vm-resume:missing-vm'))
  })

  it('forbids resuming when no VM is paused or suspended', () => {
    const result = mountResume([runningVm])

    expect(result.canResumeVms).toBe(false)
    expect(result.resumeVmsErrorMessage).toBe(t('job:vm-resume:missing-vm'))
  })

  it('ignores the VMs neither paused nor suspended', () => {
    const result = mountResume([pausedVm, runningVm])

    expect(result.canResumeVms).toBe(true)
    expect(result.resumeVmsErrorMessage).toBeUndefined()
  })

  it('explains why the paused VMs cannot be unpaused', () => {
    useUnpauseJob.mockReturnValue(createJobResult(unpause, { canRun: false, errorMessage: 'Resume in progress…' }))

    const result = mountResume([pausedVm, suspendedVm])

    expect(result.canResumeVms).toBe(false)
    expect(result.resumeVmsErrorMessage).toBe('Resume in progress…')
  })

  it('explains why the suspended VMs cannot be resumed', () => {
    useResumeJob.mockReturnValue(createJobResult(resume, { canRun: false, errorMessage: 'Resume in progress…' }))

    const result = mountResume([pausedVm, suspendedVm])

    expect(result.canResumeVms).toBe(false)
    expect(result.resumeVmsErrorMessage).toBe('Resume in progress…')
  })

  it('ignores the job left without VMs', () => {
    // A job given no VMs cannot run, it must not block the other one
    useUnpauseJob.mockReturnValue(createJobResult(unpause, { canRun: false, errorMessage: 'No VMs to resume' }))

    const result = mountResume([suspendedVm])

    expect(result.canResumeVms).toBe(true)
    expect(result.resumeVmsErrorMessage).toBeUndefined()
  })
})

describe('isResumingVms', () => {
  it('is false while no job is running', () => {
    expect(mountResume([pausedVm, suspendedVm]).isResumingVms).toBe(false)
  })

  it('is true while unpausing', () => {
    useUnpauseJob.mockReturnValue(createJobResult(unpause, { isRunning: true }))

    expect(mountResume([pausedVm]).isResumingVms).toBe(true)
  })

  it('is true while resuming', () => {
    useResumeJob.mockReturnValue(createJobResult(resume, { isRunning: true }))

    expect(mountResume([suspendedVm]).isResumingVms).toBe(true)
  })
})
