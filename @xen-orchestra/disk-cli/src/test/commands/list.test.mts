/**
 * Tests for the `list` command.
 *
 * Focus:
 *  - Handler is always disposed, even when handler.list() throws.
 *  - A broken disk produces an error row but does not abort the whole command.
 *  - Successfully opened disks are always disposed.
 *
 * Design: module mocks are registered once at the top level. Mutable variables
 * (currentListImpl, brokenPaths) are reset in beforeEach and set per-test.
 */
import { describe, test, mock, beforeEach } from 'node:test'
import assert from 'node:assert/strict'

// ---------------------------------------------------------------------------
// Spies & mutable state
// ---------------------------------------------------------------------------

const handlerDispose = mock.fn(() => Promise.resolve())
const diskDispose = mock.fn(() => Promise.resolve())

const baseDisk = {
  isDifferencing: () => false,
  getSizeOnDisk: () => 1024 * 1024 * 1024,
  getVirtualSize: () => 8 * 1024 * 1024 * 1024,
  getUuid: () => 'disk-uuid',
  getParentUuid: () => null as unknown as string,
}

// Reassigned per-test to control what handler.list() returns (or throws).
let currentListImpl: () => Promise<string[]> = async () => []

// Populated per-test to make specific paths fail to open.
const brokenPaths = new Set<string>()

// handler.list() delegates to currentListImpl so tests can change behaviour
// without re-mocking the module.
const mockHandler = {
  list: async (_dir: string, _opts?: unknown) => currentListImpl(),
}

// ---------------------------------------------------------------------------
// Module mocks
// ---------------------------------------------------------------------------

mock.module('@xen-orchestra/fs', {
  namedExports: {
    getSyncedHandler: () => Promise.resolve({ value: mockHandler, dispose: handlerDispose }),
  },
})

mock.module('@xen-orchestra/backups/disks/openDisk.mjs', {
  namedExports: {
    isDisk: (_h: unknown, p: string) => p.endsWith('.vhd'),
    openDisk: (_h: unknown, path: string) => {
      if (brokenPaths.has(path)) throw new Error('disk header corrupted')
      return Promise.resolve({ value: { ...baseDisk }, dispose: diskDispose })
    },
  },
})

const { listCommand } = await import('../../commands/list.mjs')

// ---------------------------------------------------------------------------
// Helper: capture console.log output without polluting test output.
// ---------------------------------------------------------------------------

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

describe('list command', () => {
  beforeEach(() => {
    handlerDispose.mock.resetCalls()
    diskDispose.mock.resetCalls()
    brokenPaths.clear()
    currentListImpl = async () => ['/dir/disk.vhd']
  })

  test('disposes handler on success', async () => {
    await captureLog(() => listCommand('file:///test', '/dir', []))
    assert.strictEqual(handlerDispose.mock.callCount(), 1, 'handler must be disposed once')
  })

  test('disposes handler when handler.list() throws', async () => {
    currentListImpl = async () => {
      throw new Error('network error')
    }
    await assert.rejects(() => listCommand('file:///test', '/dir', []))
    assert.strictEqual(handlerDispose.mock.callCount(), 1, 'handler must be disposed even on list() error')
  })

  test('disposes each successfully opened disk', async () => {
    currentListImpl = async () => ['/dir/a.vhd', '/dir/b.vhd']
    await captureLog(() => listCommand('file:///test', '/dir', []))
    assert.strictEqual(diskDispose.mock.callCount(), 2, 'every opened disk must be disposed')
  })

  test('broken disk produces an error row instead of aborting, dispose still ok', async () => {
    currentListImpl = async () => ['/dir/good.vhd', '/dir/broken.vhd']
    brokenPaths.add('/dir/broken.vhd')
    const output = await captureLog(() => listCommand('file:///test', '/dir', []))
    assert.ok(output.includes('error'), 'error row should appear in output')
    assert.ok(output.includes('broken.vhd'), 'broken filename should appear in output')
    assert.strictEqual(diskDispose.mock.callCount(), 1, 'good disk must still be disposed')
  })

  test('prints "No disks found" when directory contains no disk files', async () => {
    currentListImpl = async () => []
    const output = await captureLog(() => listCommand('file:///test', '/dir', []))
    assert.ok(output.includes('No disks found'))
  })
})
