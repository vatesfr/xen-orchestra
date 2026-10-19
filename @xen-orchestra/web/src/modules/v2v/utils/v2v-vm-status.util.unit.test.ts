import type { FrontXoTask } from '@/modules/task/remote-resources/use-xo-task-collection.ts'
import { getRunningV2vSourceVmIds, getV2vLastSyncAt, getV2vVmStatus } from '@/modules/v2v/utils/v2v-vm-status.util.ts'
import { createTask } from '@/test/create-task.ts'
import { createV2vImportVm, createV2vPartialImportSnapshot } from '@/test/create-v2v-import-vm.ts'
import { V2V_SNAPSHOT_NAME, V2V_TASK_PROPERTY } from '@vates/types'

const IMPORT_STATES = [
  ['warm', true],
  ['cold', false],
] as const

function createImportTask(sourceVmIds: unknown, status: FrontXoTask['status'] = 'pending') {
  return createTask({ status, properties: { [V2V_TASK_PROPERTY.SOURCE_VM_IDS]: sourceVmIds } })
}

describe('getRunningV2vSourceVmIds', () => {
  it('collects the source VM ids of the pending tasks', () => {
    const tasks = [createImportTask(['vm-1', 'vm-2']), createImportTask(['vm-3'])]

    expect(getRunningV2vSourceVmIds(tasks)).toEqual(new Set(['vm-1', 'vm-2', 'vm-3']))
  })

  it.each([
    ['a successful task', createImportTask(['vm-1'], 'success')],
    ['a failed task', createImportTask(['vm-1'], 'failure')],
    ['an interrupted task', createImportTask(['vm-1'], 'interrupted')],
    ['a task without source VM ids', createTask()],
    ['a task whose source VM ids are not a list', createImportTask('vm-1')],
  ])('ignores %s', (_, task) => {
    expect(getRunningV2vSourceVmIds([task])).toEqual(new Set())
  })

  it('ignores the source VM ids that are not strings', () => {
    expect(getRunningV2vSourceVmIds([createImportTask(['vm-1', 42, null])])).toEqual(new Set(['vm-1']))
  })

  it('collects nothing without tasks', () => {
    expect(getRunningV2vSourceVmIds([])).toEqual(new Set())
  })
})

describe('getV2vVmStatus', () => {
  it('is none without import', () => {
    expect(getV2vVmStatus(undefined, false)).toBe('none')
  })

  it.each(IMPORT_STATES)('reflects a %s import', (status, isWarm) => {
    expect(getV2vVmStatus(createV2vImportVm({ isWarm }), false)).toBe(status)
  })

  it('is running while a task imports it for the first time', () => {
    expect(getV2vVmStatus(undefined, true)).toBe('running')
  })

  it.each(IMPORT_STATES)('is running rather than %s while a task imports it again', (_, isWarm) => {
    expect(getV2vVmStatus(createV2vImportVm({ isWarm }), true)).toBe('running')
  })

  it.each([
    ['none', 'no task imports it', false],
    ['running', 'a task imports it', true],
  ] as const)('is %s while the start is locked without a source snapshot and %s', (status, _, isRunning) => {
    expect(getV2vVmStatus(createV2vImportVm({ isImporting: true }), isRunning)).toBe(status)
  })
})

describe('getV2vLastSyncAt', () => {
  it('is the time of the latest partial import snapshot, in milliseconds', () => {
    const snapshots = [100, 300, 200].map(snapshotTime =>
      createV2vPartialImportSnapshot({ snapshot_time: snapshotTime })
    )

    expect(getV2vLastSyncAt(snapshots)).toBe(300_000)
  })

  it('ignores the later snapshots of other names', () => {
    const snapshots = [
      createV2vPartialImportSnapshot({ snapshot_time: 100 }),
      createV2vPartialImportSnapshot({ snapshot_time: 200, name_label: V2V_SNAPSHOT_NAME.AFTER_COMPLETE_IMPORT }),
    ]

    expect(getV2vLastSyncAt(snapshots)).toBe(100_000)
  })

  it.each([
    ['without partial import snapshot', [createV2vPartialImportSnapshot({ name_label: 'Manual snapshot' })]],
    ['without snapshots', []],
  ])('is undefined %s', (_, snapshots) => {
    expect(getV2vLastSyncAt(snapshots)).toBeUndefined()
  })
})
