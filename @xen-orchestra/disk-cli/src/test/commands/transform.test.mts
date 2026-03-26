/**
 * Tests for the `transform` command.
 *
 * Focus:
 *  - Handler and disk are always disposed, even on pipeline error.
 *  - For a differencing disk, the leaf disk is disposed and the full chain
 *    is opened via openDiskChain; the chain is disposed at the end.
 *  - For a non-differencing disk, openDiskChain is never called.
 *  - Invalid format triggers a visible error (process.exit).
 *
 * Design: module mocks are registered once at the top level. `currentLeafDisk`
 * is reassigned per-test; spies are reset in beforeEach.
 * Tests use an empty disk (virtualSize=0, raw format) to avoid writing
 * any data to stdout.
 */
import { describe, test, mock, beforeEach } from 'node:test'
import assert from 'node:assert/strict'

// ---------------------------------------------------------------------------
// Spies & mutable state
// ---------------------------------------------------------------------------

const handlerDispose = mock.fn(() => Promise.resolve())
const leafDispose = mock.fn(() => Promise.resolve())
const chainClose = mock.fn(() => Promise.resolve())

// Empty disk — rawGenerator produces 0 bytes, so pipeline completes instantly.
const emptyDisk = {
  init: () => Promise.resolve(),
  isDifferencing: () => false,
  getBlockSize: () => 512,
  getVirtualSize: () => 0,
  hasBlock: () => false,
  readBlock: async () => ({ data: Buffer.alloc(512) }),
  close: () => Promise.resolve(),
}

// Reassigned per-test to control the leaf disk's behaviour.
let currentLeafDisk: typeof emptyDisk = { ...emptyDisk }

// Chain disk returned by openDiskChain — has a tracked close().
const chainDisk = { ...emptyDisk, close: chainClose }

// Declared after chainDisk so TypeScript infers the correct return type.
const openDiskChainSpy = mock.fn(async () => chainDisk)

// ---------------------------------------------------------------------------
// Module mocks
// ---------------------------------------------------------------------------

mock.module('@xen-orchestra/fs', {
  namedExports: {
    getSyncedHandler: () => Promise.resolve({ value: {}, dispose: handlerDispose }),
  },
})

mock.module('@xen-orchestra/backups/disks', {
  namedExports: {
    // openDisk reads `currentLeafDisk` at call-time via closure.
    openDisposableDisk: () => Promise.resolve({ value: currentLeafDisk, dispose: leafDispose }),
    openDiskChain: openDiskChainSpy,
  },
})

const { transformCommand } = await import('../../commands/transform.mjs')

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('transform command', () => {
  beforeEach(() => {
    handlerDispose.mock.resetCalls()
    leafDispose.mock.resetCalls()
    chainClose.mock.resetCalls()
    openDiskChainSpy.mock.resetCalls()
    currentLeafDisk = { ...emptyDisk }
  })

  test('disposes handler and disk on success (raw format)', async () => {
    await transformCommand('file:///test', '/vdis/disk.vhd', ['raw'])
    assert.strictEqual(handlerDispose.mock.callCount(), 1, 'handler must be disposed once')
    assert.strictEqual(leafDispose.mock.callCount(), 1, 'disk must be disposed once')
  })

  test('disposes handler and disk when pipeline throws', async () => {
    // One present block whose readBlock throws → pipeline error.
    currentLeafDisk = {
      ...emptyDisk,
      getVirtualSize: () => 512,
      hasBlock: () => true,
      readBlock: async () => {
        throw new Error('I/O error')
      },
    }
    await assert.rejects(() => transformCommand('file:///test', '/vdis/disk.vhd', ['raw']))
    assert.strictEqual(handlerDispose.mock.callCount(), 1, 'handler must be disposed even on pipeline error')
    assert.strictEqual(leafDispose.mock.callCount(), 1, 'disk must be disposed even on pipeline error')
  })

  test('non-differencing disk: openDiskChain is never called', async () => {
    await transformCommand('file:///test', '/vdis/disk.vhd', ['raw'])
    assert.strictEqual(openDiskChainSpy.mock.callCount(), 0, 'openDiskChain must not be called for a base disk')
  })

  test('differencing disk: leaf disk is disposed and chain is opened', async () => {
    currentLeafDisk = { ...emptyDisk, isDifferencing: () => true }
    await transformCommand('file:///test', '/vdis/snapshot.vhd', ['raw'])
    assert.strictEqual(leafDispose.mock.callCount(), 1, 'leaf disk must be disposed before chain is opened')
    assert.strictEqual(openDiskChainSpy.mock.callCount(), 1, 'openDiskChain must be called for a differencing disk')
  })

  test('differencing disk: chain is closed after transform', async () => {
    currentLeafDisk = { ...emptyDisk, isDifferencing: () => true }
    await transformCommand('file:///test', '/vdis/snapshot.vhd', ['raw'])
    assert.strictEqual(chainClose.mock.callCount(), 1, 'chain must be closed after transform')
  })

  test('invalid format triggers process.exit(1)', async () => {
    const exitMock = mock.method(process, 'exit', (_code: number) => {
      throw new Error(`EXIT:${_code}`)
    })
    try {
      await assert.rejects(() => transformCommand('file:///test', '/vdis/disk.vhd', ['invalid']), /EXIT:1/)
    } finally {
      exitMock.mock.restore()
    }
  })
})
