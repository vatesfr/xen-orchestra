import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import path from 'node:path'
import { tmpdir } from 'node:os'
import { rimraf } from 'rimraf'
import execa from 'execa'

import * as Directory from './directory.mjs'
import { liftRemoteImmutability } from './liftProtection.mjs'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ONE_DAY_MS = 24 * 60 * 60 * 1000

const VM_UUID = 'aaaaaaaa-0000-0000-0000-000000000001'
const JOB_UUID = 'bbbbbbbb-0000-0000-0000-000000000001'
const VDI_UUID = 'cccccccc-0000-0000-0000-000000000001'

/** Well past any reasonable immutabilityDuration. */
const EXPIRED_DATE = '20240115T120000Z'
/** Inside the window: the expiry reference is the datetime in the name, not the file's dates. */
const RECENT_DATE = new Date().toISOString().replace(/[-:.]/g, '').slice(0, 15) + 'Z'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

// Recursively lift all immutable flags inside `root`, then delete the tree.
// Must be run as root since chattr requires elevated privileges.
async function cleanupRoot(root: string): Promise<void> {
  try {
    await execa('chattr', ['-i', '-R', root])
  } catch (_err) {}
  await rimraf(root)
}

async function makeRoot(): Promise<string> {
  return await fs.mkdtemp(path.join(tmpdir(), 'immut-lift-test-'))
}

function vmDirOf(root: string): string {
  return path.join(root, 'xo-vm-backups', VM_UUID)
}

function vdiDirOf(root: string): string {
  return path.join(vmDirOf(root), 'vdis', JOB_UUID, VDI_UUID)
}

// Creates `vdis/<jobId>/<vdiId>/<datetime>.alias.vhd` plus the VHD directory it points at, the way
// XO lays them out, and returns both paths along with one block file inside the VHD directory.
async function writeDisk(root: string, datetime: string) {
  const vdiDir = vdiDirOf(root)
  const dataDir = path.join(vdiDir, 'data')
  const vhdDir = path.join(dataDir, `${datetime}.vhd`)
  const blockFile = path.join(vhdDir, 'blocks', '0', '0')

  await fs.mkdir(path.dirname(blockFile), { recursive: true })
  await fs.writeFile(blockFile, 'block')
  await fs.writeFile(path.join(vhdDir, 'footer'), 'footer')

  const alias = path.join(vdiDir, `${datetime}.alias.vhd`)
  await fs.writeFile(alias, path.relative(vdiDir, vhdDir))

  return { alias, vhdDir, blockFile }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('liftProtection/liftRemoteImmutability', async () => {
  it('lifts expired disks that no metadata json names any more', async () => {
    const root = await makeRoot()
    try {
      // Retention deletes the json first and leaves the disks to the next cleanVm, so nothing names
      // them: this is the state the sentinel-driven pass cannot reach.
      const { alias, vhdDir, blockFile } = await writeDisk(root, EXPIRED_DATE)
      await Directory.makeImmutableBatch([alias, vhdDir])

      assert.strictEqual(await Directory.isImmutable(alias), true, 'alias should start immutable')
      assert.strictEqual(await Directory.isImmutable(vhdDir), true, 'VHD directory should start immutable')

      await liftRemoteImmutability(root, ONE_DAY_MS, true)

      assert.strictEqual(await Directory.isImmutable(alias), false, 'alias should be lifted')
      assert.strictEqual(await Directory.isImmutable(vhdDir), false, 'VHD directory should be lifted')
      // A VHD directory is useless to XO unless its blocks are writable too: the merge moves block
      // files out of it.
      assert.strictEqual(await Directory.isImmutable(blockFile), false, 'blocks should be lifted too')

      // and the files are really usable again
      await fs.unlink(blockFile)
      await fs.unlink(alias)
    } finally {
      await cleanupRoot(root)
    }
  })

  it('keeps disks inside the immutability window locked', async () => {
    const root = await makeRoot()
    try {
      const { alias, vhdDir, blockFile } = await writeDisk(root, RECENT_DATE)
      await Directory.makeImmutableBatch([alias, vhdDir])

      await liftRemoteImmutability(root, ONE_DAY_MS, true)

      assert.strictEqual(await Directory.isImmutable(alias), true, 'recent alias must stay immutable')
      assert.strictEqual(await Directory.isImmutable(vhdDir), true, 'recent VHD directory must stay immutable')
      assert.strictEqual(await Directory.isImmutable(blockFile), true, 'recent blocks must stay immutable')

      await assert.rejects(fs.unlink(alias), { code: 'EPERM' })
    } finally {
      await cleanupRoot(root)
    }
  })

  it('does not sweep the disk directories outside of a full scan', async () => {
    const root = await makeRoot()
    try {
      const { alias, vhdDir } = await writeDisk(root, EXPIRED_DATE)
      await Directory.makeImmutableBatch([alias, vhdDir])

      await liftRemoteImmutability(root, ONE_DAY_MS, false)

      assert.strictEqual(await Directory.isImmutable(alias), true, 'alias should be untouched')
      assert.strictEqual(await Directory.isImmutable(vhdDir), true, 'VHD directory should be untouched')
    } finally {
      await cleanupRoot(root)
    }
  })

  it('lifts a disk whose name does not match the datetime of the backup referencing it', async () => {
    const root = await makeRoot()
    try {
      // Shape left by a merge: the alias of the recent backup points at the VHD directory of the
      // older one, whose blocks it now holds.
      const { vhdDir, blockFile } = await writeDisk(root, EXPIRED_DATE)
      const alias = path.join(vdiDirOf(root), `${RECENT_DATE}.alias.vhd`)
      await fs.writeFile(alias, path.relative(vdiDirOf(root), vhdDir))
      await fs.unlink(path.join(vdiDirOf(root), `${EXPIRED_DATE}.alias.vhd`))
      await Directory.makeImmutableBatch([alias, vhdDir])

      await liftRemoteImmutability(root, ONE_DAY_MS, true)

      // The VHD directory carries an expired datetime, so it is released and stays mergeable — the
      // reason mtime cannot be the reference: every merge would push it forward and it would never
      // expire.
      assert.strictEqual(await Directory.isImmutable(vhdDir), false, 'merged VHD directory should be lifted')
      assert.strictEqual(await Directory.isImmutable(blockFile), false, 'its blocks should be lifted')
      assert.strictEqual(await Directory.isImmutable(alias), true, 'the recent alias keeps its lock')
    } finally {
      await cleanupRoot(root)
    }
  })

  it('still lifts through the metadata json when it is present', async () => {
    const root = await makeRoot()
    try {
      const { alias, vhdDir } = await writeDisk(root, EXPIRED_DATE)
      const json = path.join(vmDirOf(root), `${EXPIRED_DATE}.json`)
      await fs.writeFile(json, '{}')
      await Directory.makeImmutableBatch([json, alias, vhdDir])

      // not a full scan: the fast path applies, and the json is immutable so it is picked up
      await liftRemoteImmutability(root, ONE_DAY_MS, false)

      assert.strictEqual(await Directory.isImmutable(json), false, 'json should be lifted')
      assert.strictEqual(await Directory.isImmutable(alias), false, 'alias should be lifted')
      assert.strictEqual(await Directory.isImmutable(vhdDir), false, 'VHD directory should be lifted')
    } finally {
      await cleanupRoot(root)
    }
  })
})
