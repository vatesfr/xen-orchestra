import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import { SynchronizedDisk } from '@xen-orchestra/disk-transform'

import { Xapi } from '../index.mjs'
import { XapiDiskSource } from './Xapi.mjs'
import { XapiQcow2StreamSource } from './XapiQcow2StreamSource.mjs'
import { XapiVhdStreamSource } from './XapiVhdStreamSource.mjs'

const BLOCK_SIZE = 2 * 1024 * 1024

// resolves once `predicate()` is true, checked after each turn of the event loop
const waitFor = async predicate => {
  while (!predicate()) {
    await new Promise(resolve => setImmediate(resolve))
  }
}

// a source disk whose blocks are read one by one, as from an export stream or NBD
function createSourceDisk() {
  const state = { closed: false, read: [] }
  const disk = {
    state,
    getBlockSize: () => BLOCK_SIZE,
    getVirtualSize: () => 4 * BLOCK_SIZE,
    getBlockIndexes: () => [0, 1, 2, 3],
    isDifferencing: () => false,
    async *buildDiskBlockGenerator() {
      for (const index of [0, 1, 2, 3]) {
        await new Promise(resolve => setImmediate(resolve))
        state.read.push(index)
        yield { index, data: Buffer.alloc(0) }
      }
    },
    async close() {
      state.closed = true
    },
  }
  return disk
}

describe('XapiDiskSource with an abort signal', () => {
  it('stops reading and closes its source once aborted', async () => {
    const sourceDisk = createSourceDisk()
    const controller = new AbortController()
    const disk = new XapiDiskSource({ signal: controller.signal, vdiRef: 'vdi', xapi: {} })
    disk.openSource = async () => sourceDisk
    await disk.init()

    const blocks = []
    await assert.rejects(
      (async () => {
        for await (const block of await disk.buildDiskBlockGenerator()) {
          blocks.push(block.index)
          controller.abort()
        }
      })(),
      { name: 'AbortError' }
    )

    assert.deepEqual(blocks, [0], 'no block is served after the abort')
    assert.equal(sourceDisk.state.closed, true, 'the source is closed')
  })

  it('fails with the abort reason when a read in progress is ended by the close', async () => {
    const controller = new AbortController()
    let rejectRead
    let reading = false
    const sourceDisk = {
      ...createSourceDisk(),
      async *buildDiskBlockGenerator() {
        yield { index: 0, data: Buffer.alloc(0) }
        // a read that only ends when the source is closed, as a stream export or an NBD read does
        reading = true
        await new Promise((resolve, reject) => {
          rejectRead = reject
        })
      },
      async close() {
        rejectRead?.(new Error('premature close'))
      },
    }
    const disk = new XapiDiskSource({ signal: controller.signal, vdiRef: 'vdi', xapi: {} })
    disk.openSource = async () => sourceDisk
    await disk.init()

    const generator = await disk.buildDiskBlockGenerator()
    await generator.next()
    const pNext = generator.next()
    await waitFor(() => reading)
    controller.abort()

    await assert.rejects(pNext, { name: 'AbortError' })
  })

  it('ends every fork when shared by several writers', async () => {
    const sourceDisk = createSourceDisk()
    const controller = new AbortController()
    const disk = new XapiDiskSource({ signal: controller.signal, vdiRef: 'vdi', xapi: {} })
    disk.openSource = async () => sourceDisk
    await disk.init()

    // as the incremental backup does for several writers
    const synchronized = new SynchronizedDisk(disk)
    const consume = async fork => {
      for await (const block of fork.diskBlocks()) {
        if (block.index === 1) {
          controller.abort()
        }
      }
    }
    // the forks are all created before any of them is consumed
    const forks = [synchronized.fork('writer 1'), synchronized.fork('writer 2')]
    const results = await Promise.allSettled(forks.map(consume))

    assert.deepEqual(
      results.map(_ => _.status),
      ['rejected', 'rejected'],
      'no writer waits forever, none completes'
    )
    assert.equal(sourceDisk.state.closed, true, 'the source is closed')
  })

  it('serves all the blocks without a signal', async () => {
    const disk = new XapiDiskSource({ vdiRef: 'vdi', xapi: {} })
    disk.openSource = async () => createSourceDisk()
    await disk.init()

    const blocks = []
    for await (const block of await disk.buildDiskBlockGenerator()) {
      blocks.push(block.index)
    }
    assert.deepEqual(blocks, [0, 1, 2, 3])
  })
})

for (const Source of [XapiVhdStreamSource, XapiQcow2StreamSource]) {
  describe(`${Source.name} with an abort signal`, () => {
    it('passes it to the XAPI export', async () => {
      let options
      const signal = new AbortController().signal
      const source = new Source({
        vdiRef: 'vdi',
        xapi: {
          VDI_exportContent: async (ref, opts) => {
            options = opts
            throw new Error('stop after the export call')
          },
        },
        signal,
      })

      await assert.rejects(source.init(), /stop after the export call/)
      assert.equal(options.signal, signal)
    })
  })
}

describe('Xapi#waitObjectState() with an abort signal', () => {
  // the parts of the Xapi instance used by waitObjectState()
  const fakeXapi = () => ({
    getObject: () => undefined,
    watchObject() {
      this.watching = true
      return () => {
        this.watching = false
      }
    },
  })

  it('rejects with the abort reason and stops watching', async () => {
    const xapi = fakeXapi()
    const controller = new AbortController()
    const pWait = Xapi.prototype.waitObjectState.call(xapi, 'ref', () => false, {
      signal: controller.signal,
      timeout: 60e3,
    })

    controller.abort()
    await assert.rejects(pWait, { name: 'AbortError' })
    assert.equal(xapi.watching, false)
  })

  it('rejects right away when already aborted', async () => {
    const controller = new AbortController()
    controller.abort()
    await assert.rejects(
      Xapi.prototype.waitObjectState.call(fakeXapi(), 'ref', () => false, { signal: controller.signal }),
      { name: 'AbortError' }
    )
  })
})

describe('XapiDiskSource#openSource() after an abort', () => {
  it('does not fall back to a full export when the export of a delta is aborted', async () => {
    const controller = new AbortController()
    let exports = 0
    const xapi = {
      getField: async (type, ref, field) => (field === 'sm_config' ? { 'image-format': 'vhd' } : undefined),
      VDI_exportContent: async () => {
        ++exports
        controller.abort()
        throw controller.signal.reason
      },
    }
    const disk = new XapiDiskSource({
      baseRef: 'base',
      preferNbd: false,
      signal: controller.signal,
      vdiRef: 'vdi',
      xapi,
    })

    await assert.rejects(disk.openSource(), { name: 'AbortError' })
    assert.equal(exports, 1, 'no second export')
  })

  it('does not fall back to stream + NBD when the CBT source is aborted', async () => {
    const controller = new AbortController()
    let exports = 0
    const xapi = {
      getField: async (type, ref, field) =>
        field === 'sm_config' ? { 'image-format': 'vhd' } : field === 'cbt_enabled' ? true : 1024,
      // the CBT source lists the changed blocks through the XAPI
      VDI_listChangedBlock: async () => {
        controller.abort()
        throw controller.signal.reason
      },
      VDI_exportContent: async () => {
        ++exports
        throw new Error('not expected')
      },
    }
    const disk = new XapiDiskSource({
      baseRef: 'base',
      preferNbd: true,
      signal: controller.signal,
      vdiRef: 'vdi',
      xapi,
    })

    await assert.rejects(disk.openSource(), { name: 'AbortError' })
    assert.equal(exports, 0, 'no fallback export')
  })
})
