import assert from 'node:assert/strict'
import { execFile, execFileSync } from 'node:child_process'
import { mkdtemp, open as openFile, readFile, rm, stat, truncate, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { setTimeout as delay } from 'node:timers/promises'
import { promisify } from 'node:util'
import { after, before, describe, it } from 'node:test'

import { FileBlockDevice, IscsiTarget } from './index.mjs'

const execFileP = promisify(execFile)

const IQN = 'iqn.2024-01.tech.vates:integ'
const LUN_SIZE = 8 * 1024 * 1024 // 8 MiB
const BLOCK_SIZE = 512

/**
 * Determine why the open-iscsi interop test cannot run here (or `false` if it
 * can). It needs root (to manage iSCSI sessions and flush block buffers) and the
 * open-iscsi initiator — the exact software XCP-ng uses. As a lighter, root-free
 * local alternative, the `libiscsi` userspace tools (`iscsi-inq`, `iscsi-ls`)
 * can smoke-test discovery/INQUIRY without touching the kernel initiator.
 */
function skipReason(): string | false {
  if (process.getuid === undefined || process.getuid() !== 0) {
    return 'requires root to manage iSCSI sessions'
  }
  try {
    execFileSync('iscsiadm', ['--version'], { stdio: 'ignore' })
  } catch {
    return 'requires open-iscsi (iscsiadm not found)'
  }
  return false
}

async function iscsiadm(args: string[]): Promise<string> {
  const { stdout } = await execFileP('iscsiadm', args)
  return stdout
}

/** Parse `iscsiadm -m session -P 3` for the attached SCSI disk of our target. */
function parseAttachedDisk(sessionOutput: string): string | undefined {
  const lines = sessionOutput.split('\n')
  const targetLine = lines.findIndex(line => line.includes(IQN))
  if (targetLine === -1) {
    return undefined
  }
  for (let i = targetLine; i < lines.length; i++) {
    const match = lines[i].match(/Attached scsi disk (sd\w+)/)
    if (match !== null) {
      return `/dev/${match[1]}`
    }
  }
  return undefined
}

async function waitForDevice(): Promise<string> {
  for (let attempt = 0; attempt < 40; attempt++) {
    const session = await iscsiadm(['-m', 'session', '-P', '3']).catch(() => '')
    const device = parseAttachedDisk(session)
    if (device !== undefined) {
      try {
        await stat(device)
        return device
      } catch {
        // device node not yet created by udev
      }
    }
    await delay(250)
  }
  throw new Error('iSCSI block device did not appear')
}

describe('open-iscsi interop', { skip: skipReason() }, () => {
  let dir: string
  let backingPath: string
  let target: IscsiTarget
  let portal: string

  before(async () => {
    dir = await mkdtemp(join(tmpdir(), 'vates-iscsi-integ-'))
    backingPath = join(dir, 'lun.img')
    await writeFile(backingPath, Buffer.alloc(0))
    await truncate(backingPath, LUN_SIZE)

    target = new IscsiTarget({
      iqn: IQN,
      host: '127.0.0.1',
      port: 0,
      lun: new FileBlockDevice({ path: backingPath, blockSize: BLOCK_SIZE }),
    })
    await target.listen()
    const address = target.address()
    assert.ok(address !== undefined)
    portal = `127.0.0.1:${address.port}`
  })

  after(async () => {
    // Best-effort teardown: logout + drop the node record so the host is clean.
    await iscsiadm(['-m', 'node', '-T', IQN, '-p', portal, '--logout']).catch(() => {})
    await iscsiadm(['-m', 'node', '-o', 'delete', '-T', IQN, '-p', portal]).catch(() => {})
    await target?.close()
    await rm(dir, { recursive: true, force: true })
  })

  it('discovers, logs in, writes and reads back a LUN', async () => {
    const discovery = await iscsiadm(['-m', 'discovery', '-t', 'sendtargets', '-p', portal])
    assert.match(discovery, new RegExp(IQN), 'SendTargets discovery should list our IQN')

    await iscsiadm(['-m', 'node', '-T', IQN, '-p', portal, '--login'])
    const device = await waitForDevice()

    // Write a recognizable pattern at block 10 through the kernel initiator.
    const lba = 10
    const offset = lba * BLOCK_SIZE
    const pattern = Buffer.alloc(BLOCK_SIZE)
    for (let i = 0; i < pattern.length; i++) {
      pattern[i] = (i * 3 + 5) & 0xff
    }
    const writeHandle = await openFile(device, 'r+')
    try {
      await writeHandle.write(pattern, 0, pattern.length, offset)
      await writeHandle.sync()
    } finally {
      await writeHandle.close()
    }

    // The WRITE path must have landed the bytes in the backing file.
    const onDisk = await readFile(backingPath)
    assert.deepEqual(onDisk.subarray(offset, offset + BLOCK_SIZE), pattern, 'backing file updated by WRITE')

    // Drop the page cache so the read traverses the target (READ path).
    await execFileP('blockdev', ['--flushbufs', device]).catch(() => {})
    const readHandle = await openFile(device, 'r')
    try {
      const buffer = Buffer.alloc(BLOCK_SIZE)
      await readHandle.read(buffer, 0, BLOCK_SIZE, offset)
      assert.deepEqual(buffer, pattern, 'data read back through the target matches')
    } finally {
      await readHandle.close()
    }
  })
})
