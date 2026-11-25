import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { computeStatusAndSortSubtasks } from './backups-ng-logs.mjs'
import { handleBackupLog } from '../_handleBackupLog.mjs'

// the result of a task aborted with `AbortController#abort()`, as serialized in the logs
const ABORT_ERROR = { name: 'AbortError', message: 'This operation was aborted', code: 20 }

const task = (status, { abortionRequestedAt, result, tasks, warnings } = {}) => ({
  abortionRequestedAt,
  status,
  result,
  tasks,
  warnings,
  start: 0,
  end: 1,
})

// a task on which an abort was requested, as logged from its `abortionRequested` event
const aborted = (status, opts) => task(status, { abortionRequestedAt: 0, ...opts })

describe('computeStatusAndSortSubtasks()', () => {
  it('gives the status interrupted to an aborted run', () => {
    assert.equal(computeStatusAndSortSubtasks(aborted('failure', { result: ABORT_ERROR })), 'interrupted')
  })

  it('gives the status interrupted to an aborted task whatever its error', () => {
    assert.equal(
      computeStatusAndSortSubtasks(aborted('failure', { result: new Error('premature close') })),
      'interrupted'
    )
  })

  it('gives the status failure to an AbortError when no abort was requested, e.g. from a pipeline or a timeout', () => {
    assert.equal(computeStatusAndSortSubtasks(task('failure', { result: ABORT_ERROR })), 'failure')
  })

  it('gives the status interrupted to the log of a job run that wraps an aborted backup task', () => {
    const backupTask = aborted('failure', { result: ABORT_ERROR })
    backupTask.status = computeStatusAndSortSubtasks(backupTask)

    assert.equal(
      computeStatusAndSortSubtasks(task('failure', { result: ABORT_ERROR, tasks: [backupTask] })),
      'interrupted'
    )
  })

  it('gives the status interrupted to an aborted VM, without failing its run', () => {
    const transfer = aborted('failure', { result: ABORT_ERROR })
    transfer.status = computeStatusAndSortSubtasks(transfer)
    const vm = aborted('failure', { result: ABORT_ERROR, tasks: [transfer] })
    vm.status = computeStatusAndSortSubtasks(vm)

    assert.equal(transfer.status, 'interrupted')
    assert.equal(vm.status, 'interrupted')
    assert.equal(computeStatusAndSortSubtasks(aborted('failure', { result: ABORT_ERROR, tasks: [vm] })), 'interrupted')
  })

  it('gives the status interrupted to a successful run with an interrupted VM', () => {
    assert.equal(
      computeStatusAndSortSubtasks(task('success', { tasks: [task('success'), task('interrupted')] })),
      'interrupted'
    )
  })

  it('keeps interrupted over skipped', () => {
    assert.equal(
      computeStatusAndSortSubtasks(task('success', { tasks: [task('interrupted'), task('skipped')] })),
      'interrupted'
    )
  })

  it('gives the status failure to an aborted run with a VM that really failed', () => {
    const failedVm = task('failure', { result: { name: 'XapiError', message: 'VM_BAD_POWER_STATE' } })
    const abortedVm = task('interrupted')

    assert.equal(
      computeStatusAndSortSubtasks(aborted('failure', { result: ABORT_ERROR, tasks: [failedVm, abortedVm] })),
      'failure'
    )
  })

  it('still gives the status failure to a failed task that was not aborted', () => {
    assert.equal(computeStatusAndSortSubtasks(task('failure', { result: new Error('target unreachable') })), 'failure')
  })

  it('still gives the status skipped to a VM with an unhealthy VDI chain', () => {
    assert.equal(
      computeStatusAndSortSubtasks(task('failure', { result: { message: 'unhealthy VDI chain' } })),
      'skipped'
    )
    assert.equal(computeStatusAndSortSubtasks(task('success', { tasks: [task('skipped')] })), 'skipped')
  })
})

describe('handleBackupLog()', () => {
  it('writes the status interrupted on the log of an aborted task, as persisted by the tasks mixin', () => {
    const log = aborted('failure', { result: ABORT_ERROR })

    handleBackupLog(log, { type: 'end' })

    assert.equal(log.status, 'interrupted')
  })
})
