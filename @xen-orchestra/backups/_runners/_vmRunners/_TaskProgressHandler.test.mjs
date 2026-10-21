import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { Task } from '@vates/task'

import { TaskProgressHandler } from './_TaskProgressHandler.mjs'

async function collectProgress(fn) {
  const progress = []
  const task = new Task({
    properties: { name: 'transfer' },
    onProgress(event) {
      if (event.type === 'property' && event.name === 'progress') {
        progress.push(event.value)
      }
    },
  })
  await task.run(fn)
  return progress
}

describe('TaskProgressHandler', () => {
  it('throttles the intermediate steps', async () => {
    const progress = await collectProgress(async () => {
      const progressHandler = new TaskProgressHandler()
      for (let i = 1; i < 1000; i++) {
        await progressHandler.setProgress(i / 1000)
      }
    })
    // initial value + at most one emit per percent
    assert.ok(progress.length <= 101, `${progress.length} emits`)
  })

  it('always emits the end, even when the last step is under the threshold', async () => {
    const progress = await collectProgress(async () => {
      const progressHandler = new TaskProgressHandler()
      await progressHandler.setProgress(0.991)
      await progressHandler.setProgress(1)
    })
    assert.equal(progress.at(-1), 100)
  })
})
