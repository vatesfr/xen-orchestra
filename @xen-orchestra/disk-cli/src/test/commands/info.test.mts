/**
 * Tests for the `info` command.
 *
 * Focus:
 *  - Handler and disk are always disposed, even when disk methods throw.
 *  - Errors from broken disks are propagated (not swallowed).
 *  - By default disks are opened with ignoreBlockIndexes: true (cheap); --size
 *    opens with ignoreBlockIndexes: false and prints the size on disk.
 *  - --chain opens the whole lineage and prints each disk.
 *
 * Design: mock.module() is called once at the top level. The mocks read mutable
 * closure variables at call-time so individual tests can inject scenarios simply
 * by reassigning a variable before calling the command.
 */
import { describe, test, mock, beforeEach } from 'node:test'
import assert from 'node:assert/strict'

// ---------------------------------------------------------------------------
// Spies & mutable state — created once and reused; reset in beforeEach.
// ---------------------------------------------------------------------------

const handlerDispose = mock.fn(() => Promise.resolve())
const diskDispose = mock.fn(() => Promise.resolve())
const chainClose = mock.fn(() => Promise.resolve())

const baseDisk = {
  isDifferencing: () => false,
  getVirtualSize: () => 1024 * 1024 * 1024,
  getBlockSize: () => 2 * 1024 * 1024,
  getSizeOnDisk: () => 128 * 1024 * 1024,
  getUuid: () => 'aaaa-bbbb',
  getParentUuid: () => 'pppp-qqqq',
}

// Reassigned per-test to inject different disk behaviours.
let currentDisk: typeof baseDisk = { ...baseDisk }

// Paths returned by the chain (root → leaf); reassigned per-test.
let chainPaths: string[] = ['/vdis/root.vhd', '/vdis/leaf.vhd']

// Records the options each openDisposableDisk call received.
const openDiskParams: Array<{ path: string; ignoreBlockIndexes?: boolean }> = []
const openChainParams: Array<{ path: string; ignoreBlockIndexes?: boolean }> = []

const openDiskChainSpy = mock.fn((params: { path: string; ignoreBlockIndexes?: boolean }) => {
  openChainParams.push(params)
  return Promise.resolve({ getPaths: () => chainPaths, close: chainClose })
})

// ---------------------------------------------------------------------------
// Module mocks — registered once. Implementations read mutable state at call-time.
// ---------------------------------------------------------------------------

mock.module('@xen-orchestra/fs', {
  namedExports: {
    getSyncedHandler: () => Promise.resolve({ value: {}, dispose: handlerDispose }),
  },
})

mock.module('@xen-orchestra/backup-archive/disks', {
  namedExports: {
    openDisposableDisk: (params: { path: string; ignoreBlockIndexes?: boolean }) => {
      openDiskParams.push(params)
      return Promise.resolve({ value: currentDisk, dispose: diskDispose })
    },
    openDiskChain: openDiskChainSpy,
  },
})

// Import the module under test AFTER mocks are registered so it receives the
// mocked implementations.
const { infoCommand } = await import('../../commands/info.mjs')

// Capture console.log output without polluting test output.
async function captureLog(fn: () => Promise<void>): Promise<string> {
  const lines: string[] = []
  const orig = console.log
  console.log = (...args: unknown[]) => lines.push(args.map(String).join(' '))
  try {
    await fn()
  } finally {
    console.log = orig
  }
  return lines.join('\n')
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('info command', () => {
  beforeEach(() => {
    handlerDispose.mock.resetCalls()
    diskDispose.mock.resetCalls()
    chainClose.mock.resetCalls()
    openDiskChainSpy.mock.resetCalls()
    openDiskParams.length = 0
    openChainParams.length = 0
    currentDisk = { ...baseDisk }
    chainPaths = ['/vdis/root.vhd', '/vdis/leaf.vhd']
  })

  test('disposes handler and disk on success', async () => {
    await captureLog(() => infoCommand('file:///test', '/vdis/disk.vhd', []))
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

  test('by default opens the disk with ignoreBlockIndexes: true and hides size on disk', async () => {
    const output = await captureLog(() => infoCommand('file:///test', '/vdis/disk.vhd', []))
    assert.strictEqual(openDiskParams.length, 1)
    assert.strictEqual(openDiskParams[0].ignoreBlockIndexes, true, 'block indexes must be skipped by default')
    assert.ok(!output.includes('Size on disk'), 'size on disk must not be printed without --size')
  })

  test('--size opens the disk with ignoreBlockIndexes: false and prints size on disk', async () => {
    const output = await captureLog(() => infoCommand('file:///test', '/vdis/disk.vhd', ['--size']))
    assert.strictEqual(openDiskParams[0].ignoreBlockIndexes, false, 'block indexes must be read with --size')
    assert.ok(output.includes('Size on disk'), 'size on disk must be printed with --size')
  })

  test('without --chain, openDiskChain is never called', async () => {
    await captureLog(() => infoCommand('file:///test', '/vdis/disk.vhd', []))
    assert.strictEqual(openDiskChainSpy.mock.callCount(), 0, 'openDiskChain must not be called without --chain')
  })

  test('--chain: opens the chain, opens each disk in it, and disposes everything', async () => {
    await captureLog(() => infoCommand('file:///test', '/vdis/leaf.vhd', ['--chain']))
    assert.strictEqual(openDiskChainSpy.mock.callCount(), 1, 'openDiskChain must be called once')
    assert.strictEqual(chainClose.mock.callCount(), 1, 'chain must be closed after enumerating paths')
    // One openDisposableDisk (and thus one dispose) per disk in the chain.
    assert.strictEqual(diskDispose.mock.callCount(), chainPaths.length, 'each chain disk must be opened and disposed')
    assert.strictEqual(handlerDispose.mock.callCount(), 1, 'handler must be disposed once')
  })

  test('--chain defaults to ignoreBlockIndexes: true for both the chain and each disk', async () => {
    await captureLog(() => infoCommand('file:///test', '/vdis/leaf.vhd', ['--chain']))
    assert.strictEqual(openChainParams[0].ignoreBlockIndexes, true, 'chain walk must skip block indexes by default')
    assert.ok(
      openDiskParams.every(p => p.ignoreBlockIndexes === true),
      'each chain disk must be opened with ignoreBlockIndexes: true'
    )
  })

  test('--chain --size reads block indexes and prints size on disk for each disk', async () => {
    const output = await captureLog(() => infoCommand('file:///test', '/vdis/leaf.vhd', ['--chain', '--size']))
    assert.strictEqual(openChainParams[0].ignoreBlockIndexes, false, 'chain walk must read block indexes with --size')
    assert.ok(
      openDiskParams.every(p => p.ignoreBlockIndexes === false),
      'each chain disk must be opened with ignoreBlockIndexes: false'
    )
    const sizeLines = output.split('\n').filter(l => l.includes('Size on disk'))
    assert.strictEqual(sizeLines.length, chainPaths.length, 'size on disk must be printed for each disk')
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
