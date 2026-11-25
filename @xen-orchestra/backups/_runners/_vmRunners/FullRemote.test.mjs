import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { PassThrough } from 'node:stream'
import { Task } from '@vates/task'

import { FullRemote } from './FullRemote.mjs'

const makeRunner = props => Object.assign(Object.create(FullRemote.prototype), props)

// resolves once `predicate()` is true, checked after each turn of the event loop
const waitFor = async predicate => {
  while (!predicate()) {
    await new Promise(resolve => setImmediate(resolve))
  }
}

describe('FullRemote#_run() after an abort', () => {
  it('stops reading the source backup', async () => {
    const source = new PassThrough()
    let writing = false
    const runner = makeRunner({
      _computeTransferList: async () => [{ timestamp: 0, vm: {}, vmSnapshot: {} }],
      _sourceRemoteAdapter: {
        readFullVmBackup: async () => source,
        readFullVmBackupChecksum: async () => {
          throw new Error('no checksum')
        },
      },
      _throttleStream: stream => stream,
      _writers: new Set([
        {
          // a writer which writes until its input ends or fails
          run: ({ stream }) =>
            new Promise((resolve, reject) => {
              writing = true
              stream.on('error', reject).on('end', resolve).resume()
            }),
        },
      ]),
    })

    const vmTask = new Task({ skipSubtasksAfterAbort: true, onProgress() {} })
    const result = await vmTask
      .run(async () => {
        const pRun = runner._run()
        await waitFor(() => writing)
        vmTask.abort()
        return Promise.race([
          pRun.then(
            () => 'resolved',
            error => error.name
          ),
          new Promise(resolve => setTimeout(resolve, 1e3, 'still reading')),
        ])
      })
      .catch(error => error.name)

    assert.equal(result, 'AbortError')
  })

  it('destroys the source stream when the abort came while the source was being opened', async () => {
    // nothing listens to its errors: destroying it must not crash the process
    const source = new PassThrough()
    let written = false
    const vmTask = new Task({ skipSubtasksAfterAbort: true, onProgress() {} })
    const runner = makeRunner({
      _computeTransferList: async () => [{ timestamp: 0, vm: {}, vmSnapshot: {} }],
      _sourceRemoteAdapter: {
        readFullVmBackup: async () => source,
        readFullVmBackupChecksum: async () => {
          // the abort lands during the awaits that precede the registration of the listener
          vmTask.abort()
          throw new Error('no checksum')
        },
      },
      _throttleStream: stream => stream,
      _writers: new Set([
        {
          run: async () => {
            written = true
          },
        },
      ]),
    })

    // the writers do not consume the stream: only the abort handling can close it
    await vmTask.run(() => runner._run()).catch(() => {})

    assert.equal(source.destroyed, true)
    assert.equal(written, true)
  })

  it('does not open the source of the next backup once aborted', async () => {
    const vmTask = new Task({ skipSubtasksAfterAbort: true, onProgress() {} })
    let opened = 0
    const runner = makeRunner({
      _computeTransferList: async () => [
        { timestamp: 0, vm: {}, vmSnapshot: {} },
        { timestamp: 1, vm: {}, vmSnapshot: {} },
      ],
      _sourceRemoteAdapter: {
        readFullVmBackup: async () => {
          ++opened
          // nothing listens to its errors: destroying it must not crash the process
          return new PassThrough()
        },
        readFullVmBackupChecksum: async () => 'checksum',
      },
      _throttleStream: stream => stream,
      _writers: new Set([
        {
          run: async () => {
            vmTask.abort()
          },
        },
      ]),
    })

    await assert.rejects(
      vmTask.run(() => runner._run()),
      { name: 'AbortError' }
    )
    assert.equal(opened, 1)
  })
})
