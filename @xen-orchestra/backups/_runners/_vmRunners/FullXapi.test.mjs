import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { PassThrough } from 'node:stream'
import { Task } from '@vates/task'

import { FullXapi } from './FullXapi.mjs'

const makeRunner = props => Object.assign(Object.create(FullXapi.prototype), props)

// resolves once `predicate()` is true, checked after each turn of the event loop
const waitFor = async predicate => {
  while (!predicate()) {
    await new Promise(resolve => setImmediate(resolve))
  }
}

describe('FullXapi#_copy() after an abort', () => {
  it('stops the XAPI export, and settles only once its writers have settled', async () => {
    let exportOpts
    let writerSettledAt
    const body = new PassThrough()
    const runner = makeRunner({
      job: {},
      _vm: { uuid: 'vm-uuid' },
      _exportedVm: { $ref: 'snapshot-ref', $getDisks: async () => [] },
      _throttleStream: stream => stream,
      _xapi: {
        // as the HTTP export does: the body fails once the signal is aborted
        VM_export: async (ref, opts) => {
          exportOpts = opts
          opts.signal?.addEventListener('abort', () => body.destroy(opts.signal.reason), { once: true })
          return { body }
        },
      },
      _writers: new Set([
        {
          // a writer that needs some time to clean up after its input failed
          run: ({ stream }) =>
            new Promise((resolve, reject) => {
              stream.on('error', error =>
                setTimeout(() => {
                  writerSettledAt = Date.now()
                  reject(error)
                }, 100)
              )
              stream.resume()
            }),
        },
      ]),
    })

    const vmTask = new Task({ onProgress() {} })
    let copyRejectedAt
    await vmTask
      .run(async () => {
        const pCopy = runner._copy()
        await waitFor(() => exportOpts !== undefined)
        assert.ok(exportOpts.signal instanceof AbortSignal, 'the export gets the abort signal')

        vmTask.abort()
        await assert.rejects(pCopy, { name: 'AbortError' })
        copyRejectedAt = Date.now()
      })
      .catch(error => {
        if (error.name !== 'AbortError') {
          throw error
        }
      })

    assert.ok(writerSettledAt <= copyRejectedAt, 'the copy settles after its writers')
  })
})
