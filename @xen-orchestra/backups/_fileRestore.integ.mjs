import { strict as assert } from 'node:assert'
import test from 'node:test'
import { execFile } from 'node:child_process'
import { copyFile, mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { promisify } from 'node:util'
import { randomBytes } from 'node:crypto'

import Disposable from 'promise-toolbox/Disposable'

import { RemoteAdapter } from './RemoteAdapter.mjs'

// losetup/dmsetup/pvcreate/vgcreate/lvcreate/mkfs all require root (CAP_SYS_ADMIN).
const skip =
  typeof process.getuid !== 'function' || process.getuid() !== 0 ? 'requires root (losetup/dmsetup/lvm)' : false

const pExec = promisify(execFile)
const uniqueName = () => `xotest${randomBytes(6).toString('hex')}`

async function withLoop(imagePath, fn) {
  const loop = (await pExec('losetup', ['--show', '-f', imagePath])).stdout.trim()
  try {
    return await fn(loop)
  } finally {
    await pExec('losetup', ['-d', loop]).catch(() => {})
  }
}

// Build a self-contained LVM image: a 64 MiB file holding one PV / VG / ext4 LV.
async function createLvmImage(imagePath, vgName, lvName) {
  await pExec('truncate', ['-s', '64M', imagePath])
  await withLoop(imagePath, async loop => {
    await pExec('pvcreate', ['-f', '-y', loop])
    await pExec('vgcreate', [vgName, loop])
    await pExec('lvcreate', ['-y', '-l', '100%FREE', '-n', lvName, vgName])
    await pExec('mkfs.ext4', ['-q', `/dev/${vgName}/${lvName}`])
    await pExec('vgchange', ['-an', vgName])
  })
}

test('LVM file-restore against real losetup/dmsetup/lvm', { skip }, async t => {
  const tmp = await mkdtemp(join(tmpdir(), 'xo-flr-'))
  const adapter = new RemoteAdapter({})
  const vg = uniqueName()
  const lv = 'root_lv'
  const image = join(tmp, 'disk.raw')
  const clone = join(tmp, 'clone.raw')
  const plain = join(tmp, 'plain.raw')

  t.after(async () => {
    await rm(tmp, { recursive: true, force: true })
    // drop any stale online-cache entries pointing at the now-deleted images
    await pExec('pvscan', ['--cache']).catch(() => {})
  })

  await createLvmImage(image, vg, lv)

  await t.test('detects the PV and renames the VG to a unique name', async () => {
    await Disposable.use(adapter._getLvmPhysicalVolume(image, undefined), async ({ originalVgName, vgName }) => {
      assert.equal(originalVgName, vg)
      assert.match(vgName, /^xo[0-9a-f]{16}$/)
      assert.notEqual(vgName, vg)
    })
  })

  await t.test('two clones of the same VM (shared PVID) list concurrently without collision', async () => {
    await copyFile(image, clone) // exact clone → identical PVID + VG name + VG UUID
    const [a, b] = await Promise.all([
      adapter._listLvmLogicalVolumes(image, undefined, []),
      adapter._listLvmLogicalVolumes(clone, undefined, []),
    ])
    assert.equal(a.length, 1)
    assert.equal(b.length, 1)
    // the human-readable name is the (shared) original; the id carries the unique renamed VG
    assert.equal(a[0].name, `${vg}/${lv}`)
    assert.equal(b[0].name, `${vg}/${lv}`)
    assert.notEqual(a[0].id, b[0].id)
  })

  await t.test('a non-LVM partition is rejected without building a snapshot', async () => {
    await pExec('truncate', ['-s', '16M', plain])
    await pExec('mkfs.ext4', ['-q', plain])
    await assert.rejects(
      Disposable.use(adapter._getLvmPhysicalVolume(plain, undefined), async () => {}),
      /no LVM physical volume/
    )
  })

  await t.test('leaves no dangling xo-pv-* dm-snapshots behind', async () => {
    const { stdout } = await pExec('dmsetup', ['ls']).catch(() => ({ stdout: '' }))
    assert.equal(/xo-pv-/.test(stdout), false, `leftover snapshots:\n${stdout}`)
  })
})
