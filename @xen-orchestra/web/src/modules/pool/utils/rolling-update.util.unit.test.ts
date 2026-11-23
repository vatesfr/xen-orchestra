import {
  canCloseRollingUpdate,
  getOfferedStartOptions,
  getRollingUpdateEstimatedEnd,
  getRollingUpdateHostsProgress,
  getRollingUpdateItemLabel,
  getRollingUpdateOperatorChangeLabel,
  getRollingUpdatePageState,
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

describe('getRollingUpdateHostsProgress', () => {
  it('is 0 without host', () => {
    expect(getRollingUpdateHostsProgress(createRun())).toBe(0)
  })

  it('is the rounded share of the hosts succeeded or not needed', () => {
    const run = createRun({
      hosts: { a: createHost('succeeded'), b: createHost('not-needed'), c: createHost('running') },
    })

    expect(getRollingUpdateHostsProgress(run)).toBe(67)
  })
})
