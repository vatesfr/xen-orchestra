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
import { openDisposableDisk } from '@xen-orchestra/backups/disks'

// ---------------------------------------------------------------------------
// Spies — created once and reused; reset in beforeEach.
// ---------------------------------------------------------------------------

const handlerDispose = mock.fn(() => Promise.resolve())
const diskDispose = mock.fn(() => Promise.resolve())

const baseDisk = {
  isDifferencing: () => false,
  getVirtualSize: () => 1024 * 1024 * 1024,
  getBlockSize: () => 2 * 1024 * 1024,
  getUuid: () => 'aaaa-bbbb',
  getParentUuid: () => 'pppp-qqqq',
}

// Reassigned per-test to inject different disk behaviours.
let currentDisk: typeof baseDisk = { ...baseDisk }

// ---------------------------------------------------------------------------
// Module mocks — registered once. openDisk reads `currentDisk` at call-time
// so tests only need to reassign the variable, not re-mock the module.
// ---------------------------------------------------------------------------

mock.module('@xen-orchestra/fs', {
  namedExports: {
    getSyncedHandler: () => Promise.resolve({ value: {}, dispose: handlerDispose }),
  },
})

mock.module('@xen-orchestra/backups/disks', {
  namedExports: {
    openDisposableDisk: () => Promise.resolve({ value: currentDisk, dispose: diskDispose }),
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
    currentDisk = { ...baseDisk }
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
})
