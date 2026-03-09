import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import path from 'node:path'
import { tmpdir } from 'node:os'
import { rimraf } from 'rimraf'
import execa from 'execa'

import * as File from './file.mjs'
import { waitForWriteDone, watchVmDirectory } from './watcher.mjs'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function mkTmp(): Promise<string> {
  return fs.mkdtemp(path.join(tmpdir(), 'watcher-test-'))
}

async function cleanupRoot(root: string): Promise<void> {
  try {
    await execa('chattr', ['-i', '-R', root])
  } catch (_err) {}
  await rimraf(root)
}

// ---------------------------------------------------------------------------
// waitForWriteDone
// ---------------------------------------------------------------------------

describe('waitForWriteDone', () => {
  it('resolves immediately when file size is already stable', async () => {
    const dir = await mkTmp()
    try {
      const file = path.join(dir, 'stable.bin')
      await fs.writeFile(file, 'hello')
      // Two polls must see the same size — give it 1 s timeout, should resolve fast
      await waitForWriteDone(file, 1000)
    } finally {
      await rimraf(dir)
    }
  })

  it('waits for ENOENT then resolves once file appears with stable size', async () => {
    const dir = await mkTmp()
    try {
      const file = path.join(dir, 'late.bin')
      // Write the file 150 ms after the poll starts
      setTimeout(async () => {
        await fs.writeFile(file, 'data')
      }, 150)
      await waitForWriteDone(file, 2000)
    } finally {
      await rimraf(dir)
    }
  })

  it('does NOT resolve on an empty file (size === 0)', async () => {
    const dir = await mkTmp()
    try {
      const file = path.join(dir, 'empty.bin')
      await fs.writeFile(file, '')
      // The function should time out because size is 0 — use a short timeout
      await assert.rejects(waitForWriteDone(file, 400), /Timeout/)
    } finally {
      await rimraf(dir)
    }
  })

  it('rejects with Timeout when file never stabilises', async () => {
    const dir = await mkTmp()
    try {
      const file = path.join(dir, 'growing.bin')
      // Keep appending so size never stabilises
      let stop = false
      const writer = (async () => {
        let i = 0
        while (!stop) {
          await fs.appendFile(file, `chunk-${i++}\n`)
          await new Promise(r => setTimeout(r, 80))
        }
      })()

      await assert.rejects(waitForWriteDone(file, 500), /Timeout/)
      stop = true
      await writer
    } finally {
      await rimraf(dir)
    }
  })

  it('resolves once a growing file stops changing', async () => {
    const dir = await mkTmp()
    try {
      const file = path.join(dir, 'finish.bin')
      await fs.writeFile(file, 'chunk1')
      // After 200 ms stop appending — function should resolve before 2 s
      setTimeout(async () => {
        await fs.appendFile(file, 'chunk2')
      }, 50)
      // No more writes after that; the size stabilises
      await waitForWriteDone(file, 2000)
    } finally {
      await rimraf(dir)
    }
  })
})

// ---------------------------------------------------------------------------
// watchVmDirectory
// ---------------------------------------------------------------------------

const VM_UUID = 'aaaaaaaa-0000-0000-0000-000000000001'
const JOB_UUID = 'bbbbbbbb-0000-0000-0000-000000000001'
const VDI_UUID = 'cccccccc-0000-0000-0000-000000000001'
const BACKUP_DATE = '20240115T120000Z'
const ONE_DAY_MS = 24 * 60 * 60 * 1000

async function waitFor(fn: () => Promise<boolean>, timeout = 8000): Promise<void> {
  const deadline = Date.now() + timeout
  while (Date.now() < deadline) {
    try {
      if (await fn()) return
    } catch {}
    await new Promise(resolve => setTimeout(resolve, 200))
  }
  throw new Error('Timed out waiting for condition')
}

describe('watchVmDirectory', () => {
  it('ignores non-.json files', async () => {
    const dir = await mkTmp()
    const indexPath = path.join(dir, '.index')
    const vmDir = path.join(dir, 'vm')
    await fs.mkdir(vmDir, { recursive: true })

    const errors: unknown[] = []
    const close = watchVmDirectory(vmDir, indexPath, err => errors.push(err))
    try {
      // Write a file that doesn't match *.json
      const xvaFile = path.join(vmDir, `${BACKUP_DATE}.xva`)
      await fs.writeFile(xvaFile, 'fake xva')
      // Give the watcher time to react
      await new Promise(r => setTimeout(r, 500))
      // Must not be immutable — no .json was written
      assert.strictEqual(await File.isImmutable(xvaFile), false, '.xva must stay mutable without .json')
      assert.strictEqual(errors.length, 0, 'no errors expected')
    } finally {
      close()
      await cleanupRoot(dir)
    }
  })

  it('ignores json files that do not match datetime prefix (e.g. cache.json.gz)', async () => {
    const dir = await mkTmp()
    const indexPath = path.join(dir, '.index')
    const vmDir = path.join(dir, 'vm')
    await fs.mkdir(vmDir, { recursive: true })

    const errors: unknown[] = []
    const close = watchVmDirectory(vmDir, indexPath, err => errors.push(err))
    try {
      const cacheFile = path.join(vmDir, 'cache.json')
      await fs.writeFile(cacheFile, '{}')
      await new Promise(r => setTimeout(r, 500))
      assert.strictEqual(await File.isImmutable(cacheFile), false, 'cache.json must stay mutable')
      assert.strictEqual(errors.length, 0)
    } finally {
      close()
      await rimraf(dir)
    }
  })

  it('deduplicates multiple fs events for the same datetime', async () => {
    const dir = await mkTmp()
    const indexPath = path.join(dir, '.index')
    const vmDir = path.join(dir, 'vm')
    await fs.mkdir(vmDir, { recursive: true })

    let lockBackupCallCount = 0
    const errors: unknown[] = []

    const close = watchVmDirectory(vmDir, indexPath, err => errors.push(err))
    try {
      const jsonFile = path.join(vmDir, `${BACKUP_DATE}.json`)
      // Write the json file twice to trigger two fs events
      await fs.writeFile(jsonFile, '{}')
      await fs.writeFile(jsonFile, '{}')

      await waitFor(() => File.isImmutable(jsonFile))
      // The file should be immutable exactly once — lockBackup was called once
      assert.strictEqual(await File.isImmutable(jsonFile), true)
      assert.strictEqual(errors.length, 0)
    } finally {
      close()
      await cleanupRoot(dir)
    }
  })

  it('locks a flat VHD file when .json is written', async () => {
    const dir = await mkTmp()
    const indexPath = path.join(dir, '.index')
    const vmDir = path.join(dir, 'vm')
    const vdiDir = path.join(vmDir, 'vdis', JOB_UUID, VDI_UUID)
    await fs.mkdir(vdiDir, { recursive: true })

    const errors: unknown[] = []
    const close = watchVmDirectory(vmDir, indexPath, err => errors.push(err))
    try {
      const vhdFile = path.join(vdiDir, `${BACKUP_DATE}.vhd`)
      const jsonFile = path.join(vmDir, `${BACKUP_DATE}.json`)
      await fs.writeFile(vhdFile, 'fake vhd data')
      await fs.writeFile(jsonFile, '{}')

      await waitFor(() => File.isImmutable(vhdFile))
      assert.strictEqual(await File.isImmutable(vhdFile), true, 'flat .vhd must be immutable')
      assert.strictEqual(errors.length, 0)
    } finally {
      close()
      await cleanupRoot(dir)
    }
  })

  it('calls onError when lockBackup fails for a non-ENOENT reason', async () => {
    // Use a regular FILE as indexPath. indexFile() will try to mkdir inside it
    // and fail with ENOTDIR — this works even when running as root (unlike chmod tricks).
    const dir = await mkTmp()
    const indexPath = path.join(dir, 'index-not-a-dir')
    await fs.writeFile(indexPath, 'not a directory')
    const vmDir = path.join(dir, 'vm')
    await fs.mkdir(vmDir, { recursive: true })

    const errors: unknown[] = []
    const close = watchVmDirectory(vmDir, indexPath, err => errors.push(err))
    try {
      const jsonFile = path.join(vmDir, `${BACKUP_DATE}.json`)
      await fs.writeFile(jsonFile, '{}')

      await waitFor(async () => errors.length > 0, 5000)
      assert.ok(errors.length > 0, 'onError must have been called')
    } finally {
      close()
      await rimraf(dir)
    }
  })
})
