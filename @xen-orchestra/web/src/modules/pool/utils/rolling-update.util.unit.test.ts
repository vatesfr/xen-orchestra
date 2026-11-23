import {
  canCloseRollingUpdate,
  getOfferedStartOptions,
  getRollingUpdateErrorSummary,
  getRollingUpdateEstimatedEnd,
  getRollingUpdateHostStatus,
  getRollingUpdateItemLabel,
  getRollingUpdateOperatorChangeLabel,
  getRollingUpdatePageState,
  getRollingUpdateProgress,
  getRollingUpdateReasonLabel,
  getRollingUpdateStepColumns,
  isRollingUpdateLive,
  isRollingUpdateStartBlocked,
} from '@/modules/pool/utils/rolling-update.util.ts'
import { t } from '@/test/i18n.ts'
import type {
  PoolRollingUpdatePrecheck,
  PoolRollingUpdateRecovery,
  PoolRollingUpdateRecoveryHost,
  PoolRollingUpdateRecoveryRun,
  PoolRollingUpdateRecoveryStep,
} from '@vates/types'

type StepStatus = PoolRollingUpdateRecoveryStep['status']

const STEP_NAMES = ['linstor', 'linstorHealth', 'evacuate', 'update', 'reboot', 'enable', 'restoreVms'] as const

function createHost(
  status: PoolRollingUpdateRecoveryHost['status'],
  steps: Partial<Record<(typeof STEP_NAMES)[number], PoolRollingUpdateRecoveryStep>> = {}
) {
  return {
    status,
    steps: Object.fromEntries(STEP_NAMES.map(name => [name, steps[name] ?? { status: 'pending' }])),
    lastError: null,
  } as PoolRollingUpdateRecoveryHost
}

function createRun(overrides: Partial<PoolRollingUpdateRecoveryRun> = {}) {
  return {
    runId: 'run-1',
    poolId: 'pool-789',
    status: 'running',
    startedAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    hosts: {},
    lastError: null,
    haltedPinnedVms: {},
    vmConflicts: [],
    operatorChanges: [],
    ...overrides,
  } as PoolRollingUpdateRecoveryRun
}

function createCheck(result: PoolRollingUpdatePrecheck['result'], liftedBy?: string) {
  return { id: 'check', result, liftedBy, objects: [] } as unknown as PoolRollingUpdatePrecheck
}

const blocked = { status: 'blocked', blockedReason: 'unreadable state' } as PoolRollingUpdateRecovery

describe('isRollingUpdateLive', () => {
  it.each(['preparing', 'running', 'resuming', 'cleaning'] as const)('is live when the run is %s', status => {
    expect(isRollingUpdateLive(createRun({ status }))).toBe(true)
  })

  it.each(['interrupted', 'failed', 'succeeded', 'awaiting-acceptance'] as const)(
    'is not live when the run is %s',
    status => {
      expect(isRollingUpdateLive(createRun({ status }))).toBe(false)
    }
  )

  it('is not live without run nor when the state is blocked', () => {
    expect(isRollingUpdateLive(undefined)).toBe(false)
    expect(isRollingUpdateLive(blocked)).toBe(false)
  })
})

describe('getRollingUpdatePageState', () => {
  it('is before the start without run', () => {
    expect(getRollingUpdatePageState(undefined, false)).toBe('before-start')
  })

  it('is up to date without run once a run succeeded in the session', () => {
    expect(getRollingUpdatePageState(undefined, true)).toBe('up-to-date')
  })

  it('is blocked when the state cannot be read', () => {
    expect(getRollingUpdatePageState(blocked, false)).toBe('blocked')
  })

  it.each(['preparing', 'running', 'resuming', 'cleaning'] as const)('is running when the run is %s', status => {
    expect(getRollingUpdatePageState(createRun({ status }), false)).toBe('running')
  })

  it.each(['failed', 'interrupted', 'awaiting-acceptance'] as const)('is interrupted when the run is %s', status => {
    expect(getRollingUpdatePageState(createRun({ status, hosts: { a: createHost('failed') } }), false)).toBe(
      'interrupted'
    )
  })

  it('is in review when the run succeeded', () => {
    expect(getRollingUpdatePageState(createRun({ status: 'succeeded' }), false)).toBe('review')
  })

  it('is in review when the run failed only on migrations, every host being done', () => {
    const run = createRun({
      status: 'failed',
      hosts: { a: createHost('succeeded'), b: createHost('not-needed') },
      vmConflicts: [{ vmId: 'vm-1', hostId: 'a', reason: 'migration-failed' }],
    })

    expect(getRollingUpdatePageState(run, false)).toBe('review')
  })

  it('is interrupted when the run failed with every host done but no failed migration', () => {
    const run = createRun({
      status: 'failed',
      hosts: { a: createHost('succeeded') },
      vmConflicts: [{ vmId: 'vm-1', hostId: 'a', reason: 'stopped' }],
    })

    expect(getRollingUpdatePageState(run, false)).toBe('interrupted')
  })

  it('is interrupted when a migration failed while a host is not done', () => {
    const run = createRun({
      status: 'failed',
      hosts: { a: createHost('succeeded'), b: createHost('failed') },
      vmConflicts: [{ vmId: 'vm-1', hostId: 'a', reason: 'migration-failed' }],
    })

    expect(getRollingUpdatePageState(run, false)).toBe('interrupted')
  })
})

describe('getRollingUpdateStepColumns', () => {
  const notNeeded: PoolRollingUpdateRecoveryStep = { status: 'not-needed' }

  it('has no XOSTOR column when both XOSTOR steps are not needed', () => {
    const columns = getRollingUpdateStepColumns(
      createHost('running', { linstor: notNeeded, linstorHealth: notNeeded, evacuate: { status: 'running' } })
    )

    expect(columns).toEqual([
      { id: 'evacuate', status: 'running' },
      { id: 'update', status: 'pending' },
      { id: 'reboot', status: 'pending' },
      { id: 'enable', status: 'pending' },
      { id: 'restoreVms', status: 'pending' },
    ])
  })

  it.each<[StepStatus, StepStatus, object]>([
    ['pending', 'pending', { status: 'pending' }],
    ['running', 'pending', { status: 'running', runningStep: 'linstor' }],
    ['observed-succeeded', 'running', { status: 'running', runningStep: 'linstorHealth' }],
    ['observed-succeeded', 'pending', { status: 'pending' }],
    ['observed-succeeded', 'observed-succeeded', { status: 'observed-succeeded' }],
    ['observed-succeeded', 'not-needed', { status: 'observed-succeeded' }],
    ['failed', 'pending', { status: 'failed' }],
    ['observed-succeeded', 'failed', { status: 'failed' }],
  ])('merges linstor=%s and linstorHealth=%s in one XOSTOR column', (linstor, linstorHealth, expected) => {
    const [xostor] = getRollingUpdateStepColumns(
      createHost('running', { linstor: { status: linstor }, linstorHealth: { status: linstorHealth } })
    )

    expect(xostor).toEqual({ id: 'xostor', ...expected })
  })
})

describe('getOfferedStartOptions', () => {
  it('offers the options which lift a blocking check, once each', () => {
    const checks = [
      createCheck('blocking', 'shutdownPinnedVms'),
      createCheck('blocking', 'shutdownPinnedVms'),
      createCheck('blocking', 'bypassBackupCheck'),
    ]

    expect(getOfferedStartOptions(checks)).toEqual(['shutdownPinnedVms', 'bypassBackupCheck'])
  })

  it('offers nothing for a check which is not blocking, has no option, or is lifted by rebootVm', () => {
    const checks = [
      createCheck('passed', 'shutdownPinnedVms'),
      createCheck('info', 'bypassBackupCheck'),
      createCheck('blocking'),
      createCheck('blocking', 'rebootVm'),
    ]

    expect(getOfferedStartOptions(checks)).toEqual([])
  })
})

describe('isRollingUpdateStartBlocked', () => {
  it('is not blocked without blocking check', () => {
    expect(isRollingUpdateStartBlocked([createCheck('passed'), createCheck('info')], {})).toBe(false)
  })

  it('is blocked until the option which lifts the check is selected', () => {
    const checks = [createCheck('blocking', 'shutdownPinnedVms')]

    expect(isRollingUpdateStartBlocked(checks, {})).toBe(true)
    expect(isRollingUpdateStartBlocked(checks, { bypassBackupCheck: true })).toBe(true)
    expect(isRollingUpdateStartBlocked(checks, { shutdownPinnedVms: false })).toBe(true)
    expect(isRollingUpdateStartBlocked(checks, { shutdownPinnedVms: true })).toBe(false)
  })

  it.each([undefined, 'rebootVm'])('stays blocked by a check lifted by %s', liftedBy => {
    const options = { acceptCurrentStateAsBaseline: true, bypassBackupCheck: true, shutdownPinnedVms: true }

    expect(isRollingUpdateStartBlocked([createCheck('blocking', liftedBy)], options)).toBe(true)
  })
})

describe('canCloseRollingUpdate', () => {
  it('can close when nothing is left unrestored', () => {
    expect(canCloseRollingUpdate(createRun())).toBe(true)
    expect(canCloseRollingUpdate(createRun({ unrestoredItems: [] }))).toBe(true)
  })

  it('can close when only items which cannot be restored are left', () => {
    const run = createRun({ unrestoredItems: [{ type: 'vm', id: 'vm-1', restorable: false }] })

    expect(canCloseRollingUpdate(run)).toBe(true)
  })

  it('cannot close while a restorable item is left', () => {
    const run = createRun({
      unrestoredItems: [
        { type: 'vm', id: 'vm-1', restorable: false },
        { type: 'schedule', id: 'schedule-1', restorable: true },
      ],
    })

    expect(canCloseRollingUpdate(run)).toBe(false)
  })
})

describe('getRollingUpdateEstimatedEnd', () => {
  const now = Date.parse('2026-01-01T01:00:00.000Z')

  const tenMinutesHost = createHost('succeeded', {
    evacuate: { status: 'observed-succeeded', startedAt: '2026-01-01T00:00:00.000Z' },
    restoreVms: { status: 'observed-succeeded', finishedAt: '2026-01-01T00:10:00.000Z' },
  })

  const twentyMinutesHost = createHost('succeeded', {
    evacuate: { status: 'observed-succeeded', startedAt: '2026-01-01T00:10:00.000Z' },
    restoreVms: { status: 'observed-succeeded', finishedAt: '2026-01-01T00:30:00.000Z' },
  })

  it('is unknown before the first host is done', () => {
    const run = createRun({ hosts: { a: createHost('running'), b: createHost('pending') } })

    expect(getRollingUpdateEstimatedEnd(run, now)).toBeUndefined()
  })

  it('is unknown when no host remains', () => {
    const run = createRun({ hosts: { a: tenMinutesHost, b: createHost('not-needed') } })

    expect(getRollingUpdateEstimatedEnd(run, now)).toBeUndefined()
  })

  it('adds the mean duration of the hosts done for each remaining host', () => {
    const run = createRun({
      hosts: {
        a: tenMinutesHost,
        b: twentyMinutesHost,
        c: createHost('running'),
        d: createHost('pending'),
        e: createHost('not-needed'),
      },
    })

    expect(getRollingUpdateEstimatedEnd(run, now)).toBe(now + 2 * 15 * 60_000)
  })

  it('ignores a host done without step dates', () => {
    const run = createRun({ hosts: { a: createHost('succeeded'), b: createHost('pending') } })

    expect(getRollingUpdateEstimatedEnd(run, now)).toBeUndefined()
  })
})

describe('labels', () => {
  it('labels an item with its kind and its name', () => {
    expect(getRollingUpdateItemLabel(t, { type: 'haltedPinnedVm', id: 'vm-1', name: 'db' })).toBe(
      `${t('rolling-update:item-type:halted-pinned-vm')} db`
    )
  })

  it('falls back to the id of an item without name', () => {
    expect(getRollingUpdateItemLabel(t, { type: 'schedule', id: 'schedule-1' })).toBe(
      `${t('rolling-update:item-type:schedule')} schedule-1`
    )
  })

  it.each(['enabled', 'missing'] as const)('labels an operator change observed as %s', observed => {
    const change = {
      type: 'ha',
      id: 'pool-789',
      name: 'HA',
      expected: observed === 'enabled' ? 'disabled' : 'present',
      observed,
    } as const

    expect(getRollingUpdateOperatorChangeLabel(t, change)).toBe(
      t(`rolling-update:operator-change:${observed}`, { item: getRollingUpdateItemLabel(t, change) })
    )
  })
})

describe('getRollingUpdateReasonLabel', () => {
  it('explains a known XAPI code, and keeps the code', () => {
    expect(getRollingUpdateReasonLabel(t, 'VM_REQUIRES_SR')).toBe(
      `${t('rolling-update:reason:vm-requires-sr')} (VM_REQUIRES_SR)`
    )
  })

  it('falls back to the code when it is not known', () => {
    expect(getRollingUpdateReasonLabel(t, 'SOME_NEW_CODE')).toBe('SOME_NEW_CODE')
  })
})

describe('getRollingUpdateErrorSummary', () => {
  it('explains why a host cannot be evacuated', () => {
    const error = {
      code: 'CANNOT_EVACUATE_HOST',
      params: ['VM_REQUIRES_SR', 'OpaqueRef:vm', 'OpaqueRef:sr'],
      message: 'CANNOT_EVACUATE_HOST(VM_REQUIRES_SR, OpaqueRef:vm, OpaqueRef:sr)',
      stack: 'XapiError: CANNOT_EVACUATE_HOST\n    at somewhere',
    }

    expect(getRollingUpdateErrorSummary(t, error)).toBe(
      t('rolling-update:error:cannot-evacuate-host', { reason: getRollingUpdateReasonLabel(t, 'VM_REQUIRES_SR') })
    )
  })

  it('is the message of any other error, without its stack', () => {
    expect(
      getRollingUpdateErrorSummary(t, { message: 'connection lost', stack: 'Error: connection lost\n    at x' })
    ).toBe('connection lost')
  })

  it('falls back to the code, then to a generic label', () => {
    expect(getRollingUpdateErrorSummary(t, { code: 'HOST_OFFLINE' })).toBe('HOST_OFFLINE')
    expect(getRollingUpdateErrorSummary(t, {})).toBe(t('error'))
  })
})

describe('getRollingUpdateProgress', () => {
  const done = { status: 'observed-succeeded' } as const
  const notNeeded = { status: 'not-needed' } as const

  it('is 0 without host', () => {
    expect(getRollingUpdateProgress(createRun())).toBe(0)
  })

  it('is the rounded share of the steps done, among the steps to do', () => {
    const run = createRun({
      hosts: {
        a: createHost('running', { linstor: notNeeded, linstorHealth: notNeeded, evacuate: done, update: done }),
        b: createHost('pending', { linstor: notNeeded, linstorHealth: notNeeded }),
      },
    })

    // 2 steps done out of 2 × 5
    expect(getRollingUpdateProgress(run)).toBe(20)
  })

  it('moves while the first host is not done yet', () => {
    const run = createRun({ hosts: { a: createHost('running', { linstor: done }), b: createHost('pending') } })

    expect(getRollingUpdateProgress(run)).toBe(7)
  })

  it('is 100 when no step is left to do', () => {
    const steps = Object.fromEntries(STEP_NAMES.map(name => [name, notNeeded]))

    const run = createRun({ hosts: { a: createHost('not-needed', steps) } })

    expect(getRollingUpdateProgress(run)).toBe(100)
  })
})

describe('getRollingUpdateHostStatus', () => {
  const done = { status: 'observed-succeeded' } as const

  const allDoneButRestore = {
    linstor: done,
    linstorHealth: done,
    evacuate: done,
    update: done,
    reboot: done,
    enable: done,
  }

  it('is the status of the host', () => {
    expect(getRollingUpdateHostStatus(createHost('running', { evacuate: { status: 'running' } }))).toBe('running')
  })

  // Its VMs come back at the end of the run only: when the run stops on another host, it is not what was interrupted
  it('is succeeded for an interrupted host which only waits for its VMs', () => {
    expect(getRollingUpdateHostStatus(createHost('interrupted', allDoneButRestore))).toBe('succeeded')
  })

  // A resumed run marks it as running again, although nothing runs on it
  it('is succeeded for a running host which only waits for its VMs', () => {
    expect(getRollingUpdateHostStatus(createHost('running', allDoneButRestore))).toBe('succeeded')
  })

  it('stays running while its VMs come back', () => {
    const host = createHost('running', { ...allDoneButRestore, restoreVms: { status: 'running' } })

    expect(getRollingUpdateHostStatus(host)).toBe('running')
  })

  it('stays interrupted while another step is left', () => {
    const host = createHost('interrupted', { ...allDoneButRestore, enable: { status: 'pending' } })

    expect(getRollingUpdateHostStatus(host)).toBe('interrupted')
  })
})
