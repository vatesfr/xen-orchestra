import { strict as assert } from 'node:assert'
import test from 'node:test'
import { execFile } from 'node:child_process'
import { copyFile, mkdir, mkdtemp, rm, symlink, writeFile } from 'node:fs/promises'
import { Stream } from 'node:stream'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { promisify } from 'node:util'
import { randomBytes } from 'node:crypto'

import Disposable from 'promise-toolbox/Disposable'
import * as tar from 'tar'

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

// xo-proxy answers this stream through Koa, which pipes only bodies passing `instanceof Stream`
// and JSON-serializes anything else: node-tar >= 7 returns a duck-typed (Minipass) stream, which
// silently turned a proxied file restore into a JSON dump of the tar object. Every format must
// resolve with a real node stream.
test('fetchPartitionFiles resolves with a node:stream for every format', async t => {
  const tmp = await mkdtemp(join(tmpdir(), 'xo-flr-fetch-'))
  t.after(() => rm(tmp, { recursive: true, force: true }))
  await writeFile(join(tmp, 'file.txt'), 'hello')

  const adapter = new RemoteAdapter({})
  // at this point of a real restore the partition is already mounted
  adapter.getPartition = Disposable.factory(async function* () {
    yield tmp
  })

  for (const [format, magic] of [
    ['tgz', Buffer.from([0x1f, 0x8b])],
    ['zip', Buffer.from('PK')],
  ]) {
    const stream = await adapter.fetchPartitionFiles('disk', 'partition', ['/file.txt'], format)
    assert.ok(stream instanceof Stream, `${format}: expected a node:stream instance`)

    const chunks = []
    for await (const chunk of stream) {
      chunks.push(chunk)
    }
    const archive = Buffer.concat(chunks)
    assert.deepEqual(archive.subarray(0, magic.length), magic, `${format}: unexpected archive header`)
  }
})

async function readAll(stream) {
  const chunks = []
  for await (const chunk of stream) {
    chunks.push(chunk)
  }
  return Buffer.concat(chunks)
}

async function listTgzEntries(archive, tmp) {
  const file = join(tmp, 'archive.tgz')
  await writeFile(file, archive)
  const entries = []
  await tar.t({ file, onReadEntry: entry => entries.push(entry.path.replace(/\/$/, '')) })
  return entries
}

// The partition is mounted on the XOA/proxy: a guest symlink is resolved against the host root,
// so following one would expose host files. Paths through a symlink are refused, and symlinks
// met while walking a directory are skipped.
test('file restore never follows symbolic links', async t => {
  const tmp = await mkdtemp(join(tmpdir(), 'xo-flr-symlink-'))
  t.after(() => rm(tmp, { recursive: true, force: true }))

  // `host` stands for the XOA filesystem, `root` for the mounted guest partition
  const host = join(tmp, 'host')
  const root = join(tmp, 'root')
  await mkdir(host)
  await writeFile(join(host, 'secret.txt'), 'host secret')
  await mkdir(join(root, 'dir'), { recursive: true })
  await writeFile(join(root, 'dir', 'file.txt'), 'guest file')
  await symlink(host, join(root, 'absolute')) // like `ln -s / foo` in the guest
  await symlink('../../host', join(root, 'dir', 'relative'))
  await symlink('file.txt', join(root, 'dir', 'in-tree'))

  const adapter = new RemoteAdapter({})
  adapter.getPartition = Disposable.factory(async function* () {
    yield root
  })

  const refusedPaths = ['/absolute', '/absolute/secret.txt', '/dir/relative', '/dir/relative/host/secret.txt']

  await t.test('listing refuses a path through a symlink', async () => {
    for (const path of refusedPaths) {
      await assert.rejects(adapter.listPartitionFiles('disk', 'partition', path), { code: 'ELINK_NOT_SUPPORTED' }, path)
    }
  })

  await t.test('listing skips symlinks', async () => {
    assert.deepEqual(await adapter.listPartitionFiles('disk', 'partition', '/'), { 'dir/': {} })
    assert.deepEqual(await adapter.listPartitionFiles('disk', 'partition', '/dir'), { 'file.txt': {} })
  })

  for (const format of ['tgz', 'zip']) {
    await t.test(`${format}: download refuses a path through a symlink`, async () => {
      for (const path of refusedPaths) {
        await assert.rejects(
          adapter.fetchPartitionFiles('disk', 'partition', ['/dir/file.txt', path], format),
          { code: 'ELINK_NOT_SUPPORTED' },
          path
        )
      }
    })
  }

  await t.test('tgz: symlinks inside a selected directory are skipped', async () => {
    const archive = await readAll(await adapter.fetchPartitionFiles('disk', 'partition', ['/dir'], 'tgz'))
    assert.deepEqual((await listTgzEntries(archive, tmp)).sort(), ['dir', 'dir/file.txt'])
  })

  await t.test('zip: symlinks inside a selected directory are skipped', async () => {
    const archive = await readAll(await adapter.fetchPartitionFiles('disk', 'partition', ['/dir'], 'zip'))
    assert.ok(archive.includes('dir/file.txt'))
    assert.equal(archive.includes('dir/relative'), false)
    assert.equal(archive.includes('dir/in-tree'), false)
  })
})

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
