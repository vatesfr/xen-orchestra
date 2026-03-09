import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import path from 'node:path'
import { tmpdir } from 'node:os'
import { rimraf } from 'rimraf'
import execa from 'execa'

import * as File from './file.mjs'
import * as Directory from './directory.mjs'
import { listOlderTargets } from './fileIndex.mjs'
import { watchRemote } from './protectRemotes.mjs'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ONE_DAY_MS = 24 * 60 * 60 * 1000

// Fake UUIDs used across all tests
const VM_UUID = 'aaaaaaaa-0000-0000-0000-000000000001'
const JOB_UUID = 'bbbbbbbb-0000-0000-0000-000000000001'
const VDI_UUID = 'cccccccc-0000-0000-0000-000000000001'
const SCHEDULE_UUID = 'dddddddd-0000-0000-0000-000000000001'
const BACKUP_DATE = '20240115T120000Z'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

// Poll `fn` every 200 ms until it returns a truthy value or `timeout` ms
// have elapsed.  Throws if the deadline is reached.
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

// Recursively lift all immutable flags inside `root`, then delete the tree.
// Must be run as root since chattr requires elevated privileges.
async function cleanupRoot(root: string): Promise<void> {
  try {
    // -i removes the immutable flag; -R recurses into every file and directory.
    await execa('chattr', ['-i', '-R', root])
  } catch (_err) {}
  await rimraf(root)
}

// Start a watcher on a fresh temp directory and return both the root path and
// the index path so the caller can create files and assert on them.
//
// `preDirs` is a list of relative paths that will be created inside `root`
// **before** starting the watcher.  The watcher must see these directories at
// startup so it can detect new files written into them later.
async function makeRemote(preDirs: string[] = []): Promise<{ root: string; indexPath: string; close: () => void }> {
  const root = await fs.mkdtemp(path.join(tmpdir(), 'immut-test-'))
  const indexPath = path.join(root, '.index')
  // Pre-create directories so the watcher has them in its watch list at startup.
  for (const relDir of preDirs) {
    await fs.mkdir(path.join(root, relDir), { recursive: true })
  }
  const { close } = await watchRemote('test', { root, indexPath, immutabilityDuration: ONE_DAY_MS })
  // Give the watcher a moment to complete its initial scan and become ready before
  // the caller starts writing files.
  await new Promise(resolve => setTimeout(resolve, 500))
  return { root, indexPath, close }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('protectRemotes/watchRemote', async () => {
  it('makes VM backup flat files (.json / .xva / .xva.checksum) immutable', async () => {
    const vmRelDir = path.join('xo-vm-backups', VM_UUID)
    const { root, close } = await makeRemote([vmRelDir])
    try {
      const vmDir = path.join(root, vmRelDir)

      const jsonFile = path.join(vmDir, `${BACKUP_DATE}.json`)
      const xvaFile = path.join(vmDir, `${BACKUP_DATE}.xva`)
      const checksumFile = path.join(vmDir, `${BACKUP_DATE}.xva.checksum`)
      // This file does NOT match any watched glob — it must stay mutable.
      const ignoredFile = path.join(vmDir, 'not-a-backup.txt')

      // xva and checksum must exist before json — json is the terminal signal
      await fs.writeFile(xvaFile, 'fake xva data')
      await fs.writeFile(checksumFile, 'abc123')
      await fs.writeFile(ignoredFile, 'should stay mutable')
      await fs.writeFile(jsonFile, '{}')

      await waitFor(() => File.isImmutable(jsonFile))
      await waitFor(() => File.isImmutable(xvaFile))
      await waitFor(() => File.isImmutable(checksumFile))

      assert.strictEqual(await File.isImmutable(jsonFile), true, '.json should be immutable')
      assert.strictEqual(await File.isImmutable(xvaFile), true, '.xva should be immutable')
      assert.strictEqual(await File.isImmutable(checksumFile), true, '.xva.checksum should be immutable')

      // Confirm writes and deletes are actually blocked.
      await assert.rejects(fs.writeFile(jsonFile, 'tampered'), { code: 'EPERM' })
      await assert.rejects(fs.unlink(xvaFile), { code: 'EPERM' })

      // Files outside the watched patterns must remain mutable.
      assert.strictEqual(await File.isImmutable(ignoredFile), false, 'non-backup file must stay mutable')
    } finally {
      close()
      await cleanupRoot(root)
    }
  })

  it('makes a VHD directory immutable once all three key files (bat/header/footer) are written', async () => {
    const vmRelDir = path.join('xo-vm-backups', VM_UUID)
    const dataRelDir = path.join(vmRelDir, 'vdis', JOB_UUID, VDI_UUID, 'data')
    const { root, close } = await makeRemote([dataRelDir])
    try {
      // xo-vm-backups/<vmUuid>/vdis/<jobId>/<vdiUuid>/data/<date>.vhd/
      const vmDir = path.join(root, vmRelDir)
      const vhdDir = path.join(root, dataRelDir, `${BACKUP_DATE}.vhd`)
      await fs.mkdir(vhdDir, { recursive: true })

      const bat = path.join(vhdDir, 'bat')
      const header = path.join(vhdDir, 'header')
      const footer = path.join(vhdDir, 'footer')
      // Subdirectory inside the VHD dir that is NOT a watched key file.
      const blocks = path.join(vhdDir, 'blocks')
      await fs.mkdir(blocks)

      await fs.writeFile(bat, 'bat data')
      await fs.writeFile(header, 'header data')
      await fs.writeFile(footer, 'footer data')

      // json written last — triggers lockBackup which locks the VHD directory
      await fs.writeFile(path.join(vmDir, `${BACKUP_DATE}.json`), '{}')

      // The whole directory (and its contents) must become immutable.
      await waitFor(() => Directory.isImmutable(vhdDir))

      assert.strictEqual(await Directory.isImmutable(vhdDir), true, 'vhd dir should be immutable')
      assert.strictEqual(await File.isImmutable(bat), true, 'bat should be immutable')
      assert.strictEqual(await File.isImmutable(header), true, 'header should be immutable')
      assert.strictEqual(await File.isImmutable(footer), true, 'footer should be immutable')

      // Confirm the lock is real.
      await assert.rejects(fs.writeFile(bat, 'tampered'), { code: 'EPERM' })
      await assert.rejects(fs.mkdir(path.join(vhdDir, 'new-subdir')), { code: 'EPERM' })
    } finally {
      close()
      await cleanupRoot(root)
    }
  })

  it('makes a flat VHD file (one per VDI, no alias format) immutable', async () => {
    const vmRelDir = path.join('xo-vm-backups', VM_UUID)
    const vdiRelDir = path.join(vmRelDir, 'vdis', JOB_UUID, VDI_UUID)
    const { root, close } = await makeRemote([vdiRelDir])
    try {
      // Pattern: xo-vm-backups/<vmUuid>/vdis/<jobId>/<vdiUuid>/<date>.vhd
      // Plain VHD file (no VHD-directory format). Locked when the VM-level
      // .json is written, which is the terminal signal for the whole backup.
      const vmDir = path.join(root, vmRelDir)
      const vhdFile = path.join(root, vdiRelDir, `${BACKUP_DATE}.vhd`)
      await fs.writeFile(vhdFile, 'fake vhd data')

      // json written last — triggers lockBackup which locks the flat VHD
      await fs.writeFile(path.join(vmDir, `${BACKUP_DATE}.json`), '{}')

      await waitFor(() => File.isImmutable(vhdFile))

      assert.strictEqual(await File.isImmutable(vhdFile), true, 'flat .vhd file should be immutable')
      await assert.rejects(fs.writeFile(vhdFile, 'tampered'), { code: 'EPERM' })
      await assert.rejects(fs.unlink(vhdFile), { code: 'EPERM' })
    } finally {
      close()
      await cleanupRoot(root)
    }
  })

  it('does NOT lock the VHD directory when only 1 or 2 of the 3 key files are written', async () => {
    const dataRelDir = path.join('xo-vm-backups', VM_UUID, 'vdis', JOB_UUID, VDI_UUID, 'data')
    const { root, close } = await makeRemote([dataRelDir])
    try {
      const vhdDir = path.join(root, dataRelDir, `${BACKUP_DATE}.vhd`)
      await fs.mkdir(vhdDir, { recursive: true })

      const bat = path.join(vhdDir, 'bat')
      const header = path.join(vhdDir, 'header')
      // footer is intentionally omitted.

      await fs.writeFile(bat, 'bat data')
      await fs.writeFile(header, 'header data')

      // Wait longer than awaitWriteFinish (2 s) + processing to be certain
      // the watcher has handled both events without locking anything.
      await new Promise(resolve => setTimeout(resolve, 5000))

      assert.strictEqual(await Directory.isImmutable(vhdDir), false, 'dir must stay mutable with only 2/3 key files')
      assert.strictEqual(await File.isImmutable(bat), false, 'bat must stay mutable')
      assert.strictEqual(await File.isImmutable(header), false, 'header must stay mutable')
    } finally {
      close()
      await cleanupRoot(root)
    }
  })

  it('makes config-backup files immutable', async () => {
    const scheduleRelDir = path.join('xo-config-backups', SCHEDULE_UUID)
    const { root, close } = await makeRemote([scheduleRelDir])
    try {
      // xo-config-backups/<scheduleId>/<date>/
      const configDir = path.join(root, scheduleRelDir, BACKUP_DATE)
      await fs.mkdir(configDir, { recursive: true })

      const dataFile = path.join(configDir, 'data')
      const dataJsonFile = path.join(configDir, 'data.json')
      const metadataFile = path.join(configDir, 'metadata.json')

      await fs.writeFile(dataFile, 'config backup data')
      await fs.writeFile(dataJsonFile, '{}')
      await fs.writeFile(metadataFile, '{}')

      await waitFor(() => File.isImmutable(dataFile))
      await waitFor(() => File.isImmutable(dataJsonFile))
      await waitFor(() => File.isImmutable(metadataFile))

      assert.strictEqual(await File.isImmutable(dataFile), true, 'data should be immutable')
      assert.strictEqual(await File.isImmutable(dataJsonFile), true, 'data.json should be immutable')
      assert.strictEqual(await File.isImmutable(metadataFile), true, 'metadata.json should be immutable')
    } finally {
      close()
      await cleanupRoot(root)
    }
  })

  it('detects a new VM directory created after the watcher starts', async () => {
    // Start with NO pre-existing VM directories.
    // The watcher must dynamically pick up xo-vm-backups/<UUID>/ created
    // after it is already running — this is the core of the cascading design.
    const { root, close } = await makeRemote([])
    try {
      const newVmUuid = 'eeeeeeee-0000-0000-0000-000000000099'
      const vmDir = path.join(root, 'xo-vm-backups', newVmUuid)

      // Create the VM directory and write backup files AFTER the watcher is running.
      await fs.mkdir(vmDir, { recursive: true })

      // xva must be written before json (json is the terminal signal).
      const xvaFile = path.join(vmDir, `${BACKUP_DATE}.xva`)
      const jsonFile = path.join(vmDir, `${BACKUP_DATE}.json`)
      await fs.writeFile(xvaFile, 'fake xva data')
      await fs.writeFile(jsonFile, '{}')

      await waitFor(() => File.isImmutable(jsonFile))
      await waitFor(() => File.isImmutable(xvaFile))

      assert.strictEqual(await File.isImmutable(jsonFile), true, '.json in new VM dir should be immutable')
      assert.strictEqual(await File.isImmutable(xvaFile), true, '.xva in new VM dir should be immutable')
      await assert.rejects(fs.writeFile(jsonFile, 'tampered'), { code: 'EPERM' })
    } finally {
      close()
      await cleanupRoot(root)
    }
  })

  it('re-indexes already-immutable files on startup when rebuildIndexOnStart is true', async () => {
    const root = await fs.mkdtemp(path.join(tmpdir(), 'immut-test-'))
    const indexPath = path.join(root, '.index')
    let close: (() => void) | undefined
    try {
      // Pre-create a backup file and manually lock it (simulates an existing
      // backup that was locked in a previous run).
      const vmDir = path.join(root, 'xo-vm-backups', VM_UUID)
      await fs.mkdir(vmDir, { recursive: true })
      const jsonFile = path.join(vmDir, `${BACKUP_DATE}.json`)
      await fs.writeFile(jsonFile, '{}')
      await File.makeImmutable(jsonFile) // lock without indexing
      assert.strictEqual(await File.isImmutable(jsonFile), true)

      // Start the watcher with rebuildIndexOnStart so it scans existing files.
      ;({ close } = await watchRemote('test', {
        root,
        indexPath,
        immutabilityDuration: ONE_DAY_MS,
        rebuildIndexOnStart: true,
      }))

      // listOlderTargets with a negative duration sets limitDate to the future,
      // so today's index entries satisfy "older than the limit" and are yielded.
      const isIndexed = async () => {
        for await (const { target } of listOlderTargets(indexPath, -ONE_DAY_MS)) {
          if (target === jsonFile) return true
        }
        return false
      }

      await waitFor(isIndexed, 10000)
      assert.ok(await isIndexed(), 'pre-existing immutable file should appear in the index')
    } finally {
      close?.()
      await cleanupRoot(root)
    }
  })
})
