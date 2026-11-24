import assert from 'node:assert/strict'
import { test } from 'node:test'
import { setTimeout } from 'node:timers/promises'

import { XapiDiskSource } from './Xapi.mjs'

class CountingXapiDiskSource extends XapiDiskSource {
  nbClosings = 0
  nbOpenings = 0
  async openSource() {
    this.nbOpenings++
    // opening an export takes time on the host
    await setTimeout(10)
    if (this.error !== undefined) {
      throw this.error
    }
    return {
      close: async () => {
        this.nbClosings++
      },
    }
  }
}

test('XapiDiskSource is only opened once when initialized concurrently', async () => {
  const disk = new CountingXapiDiskSource({ xapi: {}, vdiRef: 'OpaqueRef:vdi' })
  assert.equal(disk.isInitialized(), false)

  const inits = [disk.init(), disk.init()]
  assert.equal(disk.isInitialized(), false, 'not initialized until the source is opened')
  await Promise.all(inits)
  await disk.init()

  assert.equal(disk.nbOpenings, 1)
  assert.equal(disk.isInitialized(), true)
})

test('XapiDiskSource gives the same error to each concurrent initialization', async () => {
  const disk = new CountingXapiDiskSource({ xapi: {}, vdiRef: 'OpaqueRef:vdi' })
  disk.error = new Error('export failed')

  const results = await Promise.allSettled([disk.init(), disk.init()])

  assert.deepEqual(
    results.map(result => result.reason),
    [disk.error, disk.error]
  )
  assert.equal(disk.nbOpenings, 1)
  assert.equal(disk.isInitialized(), false)
})

test('XapiDiskSource closed while being opened closes the opened source', async () => {
  const disk = new CountingXapiDiskSource({ xapi: {}, vdiRef: 'OpaqueRef:vdi' })

  const opening = disk.init()
  await disk.close()
  await opening

  assert.equal(disk.nbOpenings, 1)
  assert.equal(disk.nbClosings, 1)
})

test('XapiDiskSource closed while its opening fails can be closed', async () => {
  const disk = new CountingXapiDiskSource({ xapi: {}, vdiRef: 'OpaqueRef:vdi' })
  disk.error = new Error('export failed')

  const opening = disk.init()
  await disk.close()
  await assert.rejects(opening, disk.error)

  assert.equal(disk.nbClosings, 0)
})

test('XapiDiskSource is not opened once closed', async () => {
  const disk = new CountingXapiDiskSource({ xapi: {}, vdiRef: 'OpaqueRef:vdi' })

  await disk.close()
  await assert.rejects(disk.init(), /closed disk/)

  assert.equal(disk.nbOpenings, 0)
})
