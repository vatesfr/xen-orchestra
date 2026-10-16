/**
 * Tests for the `scan-store` command.
 *
 * Focus:
 *  - Dry run by default: --remove and --verify are only passed when asked.
 *  - The summary tells removed from found, and counts the corrupted blocks.
 *  - Handler is always disposed, even when the scan throws.
 *
 * Design: module mocks are registered once at the top level. currentScanImpl is
 * reset in beforeEach and set per-test.
 */
import { describe, test, mock, beforeEach } from 'node:test'
import assert from 'node:assert/strict'

type ScanOpts = {
  remove?: boolean
  verify?: boolean
  logWarn?: (message: string, data?: object) => void
  logDebug?: (message: string, data?: object) => void
}

const handlerDispose = mock.fn(() => Promise.resolve())
const mockHandler = {}

// Records the options each scanBlockStore call received.
const scanOpts: ScanOpts[] = []

// Reassigned per-test to control what scanBlockStore does.
let currentScanImpl: (opts: ScanOpts) => Promise<{ removed: number }> = async () => ({ removed: 0 })

mock.module('@xen-orchestra/fs', {
  namedExports: {
    getSyncedHandler: () => Promise.resolve({ value: mockHandler, dispose: handlerDispose }),
  },
})

mock.module('@xen-orchestra/backup-archive/disks/hashed', {
  namedExports: {
    scanBlockStore: (handler: unknown, opts: ScanOpts) => {
      assert.equal(handler, mockHandler)
      scanOpts.push(opts)
      return currentScanImpl(opts)
    },
  },
})

const { scanStoreCommand } = await import('../../commands/scanStore.mjs')

// Captures console.log and console.error without polluting test output.
async function capture(fn: () => Promise<void>): Promise<{ out: string; err: string }> {
  const out: string[] = []
  const err: string[] = []
  const { log, error } = console
  console.log = (...args: unknown[]) => out.push(args.map(String).join(' '))
  console.error = (...args: unknown[]) => err.push(args.map(String).join(' '))
  try {
    await fn()
  } finally {
    console.log = log
    console.error = error
  }
  return { out: out.join('\n'), err: err.join('\n') }
}

beforeEach(() => {
  scanOpts.length = 0
  handlerDispose.mock.resetCalls()
  currentScanImpl = async () => ({ removed: 0 })
})

describe('scanStoreCommand', () => {
  test('is a dry run by default', async () => {
    currentScanImpl = async () => ({ removed: 3 })

    const { out } = await capture(() => scanStoreCommand('file:///backups', '', []))

    assert.equal(scanOpts.length, 1)
    assert.equal(scanOpts[0].remove, false)
    assert.equal(scanOpts[0].verify, false)
    assert.match(out, /unused store blocks: 3 found \(dry run/)
    assert.doesNotMatch(out, /corrupted/)
    assert.equal(handlerDispose.mock.callCount(), 1)
  })

  test('--remove deletes the unused blocks', async () => {
    currentScanImpl = async () => ({ removed: 2 })

    const { out } = await capture(() => scanStoreCommand('file:///backups', '', ['--remove']))

    assert.equal(scanOpts[0].remove, true)
    assert.match(out, /unused store blocks: 2 removed/)
  })

  test('--verify counts and reports the corrupted blocks', async () => {
    currentScanImpl = async ({ logWarn }) => {
      logWarn!('corrupted store block', { path: '/xo-block-store/ab/cd/abcd/0', error: new Error('hash mismatch') })
      logWarn!('corrupted store block', { path: '/xo-block-store/ef/01/ef01/0', error: new Error('bad magic') })
      return { removed: 0 }
    }

    const { out, err } = await capture(() => scanStoreCommand('file:///backups', '', ['--verify']))

    assert.equal(scanOpts[0].verify, true)
    assert.match(out, /corrupted store blocks: 2/)
    assert.match(err, /abcd\/0 \(hash mismatch\)/)
    assert.match(err, /ef01\/0 \(bad magic\)/)
  })

  test('--verbose prints every unused block', async () => {
    currentScanImpl = async ({ logDebug }) => {
      logDebug!('orphan store file', { path: '/xo-block-store/ab/cd/abcd/0' })
      return { removed: 1 }
    }

    const quiet = await capture(() => scanStoreCommand('file:///backups', '', []))
    const verbose = await capture(() => scanStoreCommand('file:///backups', '', ['--verbose']))

    assert.equal(quiet.err, '')
    assert.match(verbose.err, /orphan store file: \/xo-block-store\/ab\/cd\/abcd\/0/)
  })

  test('disposes the handler when the scan throws', async () => {
    currentScanImpl = async () => {
      throw new Error('EACCES')
    }

    await assert.rejects(() => scanStoreCommand('file:///backups', '', ['--remove']), /EACCES/)
    assert.equal(handlerDispose.mock.callCount(), 1)
  })
})
