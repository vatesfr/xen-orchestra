import { useVmBulkPowerStateActions } from '@/modules/vm/composables/use-vm-bulk-power-state-actions.composable.ts'
import type { useVmResume } from '@/modules/vm/composables/use-vm-resume.composable.ts'
import type { useXoVmForceRebootJob } from '@/modules/vm/jobs/xo-vm-force-reboot.job.ts'
import type { useXoVmForceShutdownJob } from '@/modules/vm/jobs/xo-vm-force-shutdown.job.ts'
import type { useXoVmPauseJob } from '@/modules/vm/jobs/xo-vm-pause.job.ts'
import type { useXoVmRebootJob } from '@/modules/vm/jobs/xo-vm-reboot.job.ts'
import type { useXoVmShutdownJob } from '@/modules/vm/jobs/xo-vm-shutdown.job.ts'
import type { useXoVmStartJob } from '@/modules/vm/jobs/xo-vm-start.job.ts'
import type { useXoVmSuspendJob } from '@/modules/vm/jobs/xo-vm-suspend.jobs.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { createJobResult } from '@/test/create-job-result.ts'
import { createVm } from '@/test/create-vm.ts'
import { t } from '@/test/i18n.ts'
import { mountComposable } from '@/test/mount-composable.ts'
import type { useActionModal } from '@core/composables/modals/use-action-modal.ts'
import { VM_POWER_STATE } from '@vates/types'
import { type MaybeRefOrGetter, toValue } from 'vue'

const { JOB_NAMES, runs, jobs, openModal } = vi.hoisted(() => {
  const JOB_NAMES = [
    'start',
    'pause',
    'resume',
    'suspend',
    'reboot',
    'forceReboot',
    'shutdown',
    'forceShutdown',
  ] as const

  const createMocks = <TFn extends (...args: never[]) => unknown>() =>
    Object.fromEntries(JOB_NAMES.map(name => [name, vi.fn<TFn>()])) as Record<
      (typeof JOB_NAMES)[number],
      ReturnType<typeof vi.fn<TFn>>
    >

  return {
    JOB_NAMES,
    runs: createMocks<(...args: unknown[]) => void>(),
    jobs: createMocks<(vms: unknown) => ReturnType<typeof createJobResult<(...args: unknown[]) => void>>>(),
    openModal: vi.fn(),
  }
})

type JobName = (typeof JOB_NAMES)[number]

// The jobs and the resume composable call the REST API and open SSE subscriptions
vi.mock(import('@/modules/vm/jobs/xo-vm-start.job.ts'), () => ({
  useXoVmStartJob: jobs.start as unknown as typeof useXoVmStartJob,
}))

vi.mock(import('@/modules/vm/jobs/xo-vm-pause.job.ts'), () => ({
  useXoVmPauseJob: jobs.pause as unknown as typeof useXoVmPauseJob,
}))

vi.mock(import('@/modules/vm/jobs/xo-vm-suspend.jobs.ts'), () => ({
  useXoVmSuspendJob: jobs.suspend as unknown as typeof useXoVmSuspendJob,
}))

vi.mock(import('@/modules/vm/jobs/xo-vm-reboot.job.ts'), () => ({
  useXoVmRebootJob: jobs.reboot as unknown as typeof useXoVmRebootJob,
}))

vi.mock(import('@/modules/vm/jobs/xo-vm-force-reboot.job.ts'), () => ({
  useXoVmForceRebootJob: jobs.forceReboot as unknown as typeof useXoVmForceRebootJob,
}))

vi.mock(import('@/modules/vm/jobs/xo-vm-shutdown.job.ts'), () => ({
  useXoVmShutdownJob: jobs.shutdown as unknown as typeof useXoVmShutdownJob,
}))

vi.mock(import('@/modules/vm/jobs/xo-vm-force-shutdown.job.ts'), () => ({
  useXoVmForceShutdownJob: jobs.forceShutdown as unknown as typeof useXoVmForceShutdownJob,
}))

vi.mock(import('@/modules/vm/composables/use-vm-resume.composable.ts'), () => ({
  useVmResume: ((vms: unknown) => {
    const { run, canRun, isRunning, errorMessage } = jobs.resume(vms)

    return { resumeVms: run, canResumeVms: canRun, isResumingVms: isRunning, resumeVmsErrorMessage: errorMessage }
  }) as unknown as typeof useVmResume,
}))

vi.mock(import('@core/composables/modals/use-action-modal.ts'), () => ({
  useActionModal: (() => ({ open: openModal })) as unknown as typeof useActionModal,
}))

beforeEach(() => {
  for (const name of JOB_NAMES) {
    runs[name].mockReset()
    jobs[name].mockReset().mockReturnValue(createJobResult(runs[name]))
  }

  openModal.mockReset()
})

function setJobState(name: JobName, state: Parameters<typeof createJobResult>[1]) {
  jobs[name].mockReturnValue(createJobResult(runs[name], state))
}

function getTargetedVmIds(name: JobName) {
  return toValue(jobs[name].mock.calls[0][0] as MaybeRefOrGetter<FrontXoVm[]>).map(vm => vm.id)
}

const haltedVm = createVm({ id: 'vm-halted' as FrontXoVm['id'], power_state: VM_POWER_STATE.HALTED })

const runningVm = createVm({
  id: 'vm-running' as FrontXoVm['id'],
  name_label: 'Web server',
  power_state: VM_POWER_STATE.RUNNING,
})

const runningVmWithoutGuestTools = createVm({
  id: 'vm-running-without-guest-tools' as FrontXoVm['id'],
  power_state: VM_POWER_STATE.RUNNING,
  pvDriversDetected: false,
})

const pausedVm = createVm({ id: 'vm-paused' as FrontXoVm['id'], power_state: VM_POWER_STATE.PAUSED })

const suspendedVm = createVm({ id: 'vm-suspended' as FrontXoVm['id'], power_state: VM_POWER_STATE.SUSPENDED })

function findActions(vms: FrontXoVm[] = [runningVm]) {
  const { powerStateActions } = mountComposable(() => useVmBulkPowerStateActions(vms)).wrapper.vm

  const [start, pause, resume, suspend, reboot, forceReboot, shutdown, forceShutdown] = powerStateActions

  return { start, pause, resume, suspend, reboot, forceReboot, shutdown, forceShutdown }
}

function confirmModal() {
  openModal.mock.calls[0][0].events.onConfirm()
}

describe('powerStateActions', () => {
  it.each(['start', 'pause', 'resume', 'suspend'] as const)('runs the %s action in one click', name => {
    findActions()[name].onClick()

    expect(runs[name]).toHaveBeenCalledOnce()
    expect(openModal).not.toHaveBeenCalled()
  })

  it('reflects the state of each job', () => {
    setJobState('start', { isRunning: true })
    setJobState('pause', { canRun: false, errorMessage: 'VM must be running' })
    setJobState('resume', { canRun: false, errorMessage: 'No VMs to resume' })

    const { start, pause, resume } = findActions()

    expect(start).toMatchObject({ busy: true, disabled: false })
    expect(pause).toMatchObject({ disabled: true, hint: 'VM must be running' })
    expect(resume).toMatchObject({ disabled: true, hint: 'No VMs to resume' })
  })
})

describe('targeted VMs', () => {
  const selection = [haltedVm, runningVm, runningVmWithoutGuestTools, pausedVm, suspendedVm]

  it.each([
    { name: 'start', expectedVms: [haltedVm] },
    { name: 'pause', expectedVms: [runningVm, runningVmWithoutGuestTools] },
    { name: 'suspend', expectedVms: [runningVm] },
    { name: 'reboot', expectedVms: [runningVm, pausedVm] },
    { name: 'forceReboot', expectedVms: [runningVm, runningVmWithoutGuestTools, pausedVm] },
    { name: 'shutdown', expectedVms: [runningVm] },
    { name: 'forceShutdown', expectedVms: [runningVm, runningVmWithoutGuestTools, pausedVm, suspendedVm] },
  ] as const)('hands the $name job only the VMs able to reach its final state', ({ name, expectedVms }) => {
    findActions(selection)

    expect(getTargetedVmIds(name)).toEqual(expectedVms.map(vm => vm.id))
  })

  it('hands the resume action the whole selection', () => {
    findActions(selection)

    expect(getTargetedVmIds('resume')).toEqual(selection.map(vm => vm.id))
  })
})

describe('actions requiring a confirmation', () => {
  const confirmedActions = [
    { name: 'reboot', action: 'reboot' },
    { name: 'forceReboot', action: 'force-reboot' },
    { name: 'shutdown', action: 'shutdown' },
    { name: 'forceShutdown', action: 'force-shutdown' },
  ] as const

  it.each(confirmedActions)('asks to confirm the $action of the only VM it targets', ({ name, action }) => {
    findActions([runningVm, haltedVm])[name].onClick()

    expect(openModal.mock.calls[0][0].props).toStrictEqual({
      accent: 'info',
      action,
      object: 'vm',
      vmCount: 1,
      icon: 'status:info-picto',
      confirmationText: undefined,
    })
    expect(runs[name]).not.toHaveBeenCalled()
  })

  it.each(confirmedActions)('asks to type the number of VMs to $action when it targets several', ({ name }) => {
    findActions([runningVm, createVm({ id: 'vm-2' as FrontXoVm['id'] })])[name].onClick()

    expect(openModal.mock.calls[0][0].props).toMatchObject({ vmCount: 2, confirmationText: t('n-vms', { n: 2 }) })
  })

  it.each(confirmedActions)('runs the $action in the background once confirmed', ({ name }) => {
    findActions()[name].onClick()

    confirmModal()

    expect(runs[name]).toHaveBeenCalledWith({ detached: true })
  })
})

describe('guest tools', () => {
  const guestToolsActions = ['suspend', 'reboot', 'shutdown'] as const

  it('explains that guest tools are missing when no VM able to reach the state has them', () => {
    // The jobs are left without VMs, so they cannot run
    for (const name of guestToolsActions) {
      setJobState(name, { canRun: false, errorMessage: 'No VMs' })
    }

    const actions = findActions([runningVmWithoutGuestTools, haltedVm])

    for (const name of guestToolsActions) {
      expect(actions[name]).toMatchObject({ disabled: true, hint: t('vm-tools-missing') })
    }
  })

  it('explains why the job cannot run when some VMs have guest tools', () => {
    setJobState('reboot', { canRun: false, errorMessage: 'Reboot in progress…' })

    const { reboot } = findActions([runningVm, runningVmWithoutGuestTools])

    expect(reboot).toMatchObject({ disabled: true, hint: 'Reboot in progress…' })
  })

  it('explains why the job cannot run when no VM is able to reach the state', () => {
    setJobState('shutdown', { canRun: false, errorMessage: 'No VMs to shutdown' })

    const { shutdown } = findActions([haltedVm])

    expect(shutdown).toMatchObject({ disabled: true, hint: 'No VMs to shutdown' })
  })

  it('keeps the actions available while some VMs have guest tools', () => {
    const actions = findActions([runningVm, runningVmWithoutGuestTools])

    for (const name of guestToolsActions) {
      expect(actions[name]).toMatchObject({ disabled: false, hint: undefined })
    }
  })
})
