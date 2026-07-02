/**
 * Tests for the `info` command.
 *
 * Focus:
 *  - Handler and disk are always disposed, even when disk methods throw.
 *  - Errors from broken disks are propagated (not swallowed).
 *
 * Design: mock.module() is called once at the top level. The mock for openDisk
 * reads `currentDisk` at call-time via closure, so individual tests can inject
 * failure scenarios simply by reassigning the variable before calling the command.
 */
import { describe, test, mock, beforeEach } from 'node:test'
import assert from 'node:assert/strict'

// ---------------------------------------------------------------------------
// Spies — created once and reused; reset in beforeEach.
// ---------------------------------------------------------------------------

const handlerDispose = mock.fn(() => Promise.resolve())
const diskDispose = mock.fn(() => Promise.resolve())
const chainClose = mock.fn(() => Promise.resolve())

const baseDisk = {
  isDifferencing: () => false,
  getVirtualSize: () => 1024 * 1024 * 1024,
  getBlockSize: () => 2 * 1024 * 1024,
  getUuid: () => 'aaaa-bbbb',
  getParentUuid: () => 'pppp-qqqq',
}

// Reassigned per-test to inject different disk behaviours.
let currentDisk: typeof baseDisk = { ...baseDisk }

// Paths returned by the chain (root → leaf); reassigned per-test.
let chainPaths: string[] = ['/vdis/root.vhd', '/vdis/leaf.vhd']

// Chain returned by openDiskChain — only getPaths() and close() are used by `info`.
const openDiskChainSpy = mock.fn(() => Promise.resolve({ getPaths: () => chainPaths, close: chainClose }))

// ---------------------------------------------------------------------------
// Module mocks — registered once. openDisk reads `currentDisk` at call-time
// so tests only need to reassign the variable, not re-mock the module.
// ---------------------------------------------------------------------------

mock.module('@xen-orchestra/fs', {
  namedExports: {
    getSyncedHandler: () => Promise.resolve({ value: {}, dispose: handlerDispose }),
  },
})

mock.module('@xen-orchestra/backup-archive/disks', {
  namedExports: {
    openDisposableDisk: () => Promise.resolve({ value: currentDisk, dispose: diskDispose }),
    openDiskChain: openDiskChainSpy,
  },
})

// Import the module under test AFTER mocks are registered so it receives the
// mocked implementations. The same infoCommand reference is reused for all tests.
const { infoCommand } = await import('../../commands/info.mjs')

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('info command', () => {
  beforeEach(() => {
    handlerDispose.mock.resetCalls()
    diskDispose.mock.resetCalls()
    chainClose.mock.resetCalls()
    openDiskChainSpy.mock.resetCalls()
    currentDisk = { ...baseDisk }
    chainPaths = ['/vdis/root.vhd', '/vdis/leaf.vhd']
  })

  test('disposes handler and disk on success', async () => {
    await infoCommand('file:///test', '/vdis/disk.vhd', [])
    assert.strictEqual(handlerDispose.mock.callCount(), 1, 'handler must be disposed once')
    assert.strictEqual(diskDispose.mock.callCount(), 1, 'disk must be disposed once')
  })

  test('disposes handler and disk when a disk method throws', async () => {
    currentDisk = {
      ...baseDisk,
      getUuid: () => {
        throw new Error('corrupt header')
      },
    }
    await assert.rejects(() => infoCommand('file:///test', '/vdis/disk.vhd', []))
    assert.strictEqual(handlerDispose.mock.callCount(), 1, 'handler must be disposed even on error')
    assert.strictEqual(diskDispose.mock.callCount(), 1, 'disk must be disposed even on error')
  })

  test('error from broken disk is not swallowed', async () => {
    currentDisk = {
      ...baseDisk,
      getVirtualSize: () => {
        throw new Error('corrupt header')
      },
    }
    await assert.rejects(() => infoCommand('file:///test', '/vdis/disk.vhd', []), /corrupt header/)
  })

  test('without --chain, openDiskChain is never called', async () => {
    await infoCommand('file:///test', '/vdis/disk.vhd', [])
    assert.strictEqual(openDiskChainSpy.mock.callCount(), 0, 'openDiskChain must not be called without --chain')
  })

  test('--chain: opens the chain, opens each disk in it, and disposes everything', async () => {
    await infoCommand('file:///test', '/vdis/leaf.vhd', ['--chain'])
    assert.strictEqual(openDiskChainSpy.mock.callCount(), 1, 'openDiskChain must be called once')
    assert.strictEqual(chainClose.mock.callCount(), 1, 'chain must be closed after enumerating paths')
    // One openDisposableDisk (and thus one dispose) per disk in the chain.
    assert.strictEqual(diskDispose.mock.callCount(), chainPaths.length, 'each chain disk must be opened and disposed')
    assert.strictEqual(handlerDispose.mock.callCount(), 1, 'handler must be disposed once')
  })

  test('--chain: chain is closed even when opening a disk in it throws', async () => {
    currentDisk = {
      ...baseDisk,
      getUuid: () => {
        throw new Error('corrupt header')
      },
    }
    await assert.rejects(() => infoCommand('file:///test', '/vdis/leaf.vhd', ['--chain']), /corrupt header/)
    assert.strictEqual(chainClose.mock.callCount(), 1, 'chain must be closed even on error')
    assert.strictEqual(handlerDispose.mock.callCount(), 1, 'handler must be disposed even on error')
  })
})
