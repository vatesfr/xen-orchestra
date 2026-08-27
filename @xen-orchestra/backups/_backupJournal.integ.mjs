import test from 'node:test'
import { strict as assert } from 'node:assert'

import tmp from 'tmp'
import fs from 'fs-extra'
import * as uuid from 'uuid'
import { getHandler } from '@xen-orchestra/fs'
import { pFromCallback } from 'promise-toolbox'
import { setTimeout as sleep } from 'node:timers/promises'
import { RemoteAdapter } from './RemoteAdapter.mjs'
import { VHDFOOTER, VHDHEADER } from './tests.fixtures.mjs'
import { VhdFile, Constants } from 'vhd-lib'
import { rimraf } from 'rimraf'

import { BACKUP_JOURNAL_DIR, formatJournalDate, formatJournalDay } from './_backupJournal.mjs'
import { formatFilenameDate } from './_filenameDate.mjs'

const { beforeEach, afterEach, describe } = test

const noop = Function.prototype
const byFilename = (a, b) => (a.filename < b.filename ? -1 : 1)

const vmUuid = 'a1b2c3d4-0000-0000-0000-000000000000'
const rootPath = `xo-vm-backups/${vmUuid}`

let tempDir, adapter, handler, jobId, scheduleId, relativePath, basePath

beforeEach(async () => {
  tempDir = await pFromCallback(cb => tmp.dir(cb))
  handler = getHandler({ url: `file://${tempDir}` })
  await handler.sync()
  adapter = new RemoteAdapter(handler)
  jobId = uniqueId()
  scheduleId = uniqueId()
  relativePath = `vdis/${jobId}/${uniqueId()}`
  basePath = `${rootPath}/${relativePath}`
  await fs.mkdirp(`${tempDir}/${basePath}`)
})

afterEach(async () => {
  await rimraf(tempDir)
  await handler.forget()
})

const uniqueId = () => uuid.v1()
const uniqueIdBuffer = () => uuid.v1({}, Buffer.alloc(16))

const listJournalDays = () => handler.list(`/${BACKUP_JOURNAL_DIR}`, { ignoreMissing: true })

// paths of the journal entries of every day, oldest first
async function listJournal() {
  const paths = []
  for (const day of (await listJournalDays()).filter(name => /^\d{8}$/.test(name))) {
    paths.push(...(await handler.list(`/${BACKUP_JOURNAL_DIR}/${day}`, { prependDir: true })))
  }
  return paths.sort()
}

// writes a journal entry the way a past run would have, i.e. in the directory of its own day
function writeJournalEntryAt(timestamp, entry) {
  const date = formatJournalDate(timestamp)
  return handler.outputFile(
    `/${BACKUP_JOURNAL_DIR}/${formatJournalDay(timestamp)}/${date}-000000-${entry.event}-${entry.vmUuid}-${entry.filename.split('/').pop()}`,
    JSON.stringify({ ...entry, timestamp })
  )
}

// journal entries are stamped with the writer's clock, therefore a watermark used in an assertion
// must be strictly between the entries written before it and the ones written after it
async function mark() {
  await sleep(5)
  const since = Date.now()
  await sleep(5)
  return since
}

async function generateVhd(path, opts = {}) {
  const fd = await handler.openFile(path, 'wx')
  const vhd = new VhdFile(handler, fd)

  vhd.header = { ...VHDHEADER, ...opts.header }
  vhd.footer = { ...VHDFOOTER, ...opts.footer, uuid: uniqueIdBuffer() }
  vhd.footer.diskType = vhd.header.parentUuid ? Constants.DISK_TYPES.DIFFERENCING : Constants.DISK_TYPES.DYNAMIC

  for (const blockId of opts.blocks ?? []) {
    await vhd.writeEntireBlock({ id: blockId, buffer: Buffer.alloc(2 * 1024 * 1024 + 512, blockId) })
  }
  await vhd.writeBlockAllocationTable()
  await vhd.writeHeader()
  await vhd.writeFooter()
  return vhd
}

// enough to satisfy isValidXva(): uncompressed, more than 1024 bytes, a multiple of 512, and ending
// with 1024 zeroed bytes
const createMinimalXva = () => Buffer.alloc(2048)

// write backups the way a backup job would, i.e. through the adapter
async function writeFullBackup(timestamp = Date.now()) {
  const xva = `${formatFilenameDate(timestamp)}.xva`
  await handler.outputFile(`/${rootPath}/${xva}`, createMinimalXva())
  return adapter.writeVmBackupMetadata(vmUuid, {
    mode: 'full',
    xva: `./${xva}`,
    vm: { uuid: vmUuid },
    jobId,
    scheduleId,
    timestamp,
    size: await handler.getSize(`/${rootPath}/${xva}`),
  })
}

async function writeDeltaBackup(timestamp = Date.now()) {
  const vhd = `${formatFilenameDate(timestamp)}.vhd`
  await generateVhd(`${basePath}/${vhd}`, { blocks: [0] })
  return adapter.writeVmBackupMetadata(vmUuid, {
    mode: 'delta',
    vhds: { vdi: `${relativePath}/${vhd}` },
    vdis: { vdi: {} },
    vm: { uuid: vmUuid },
    jobId,
    scheduleId,
    timestamp,
  })
}

describe('backup journal', { concurrency: 1 }, () => {
  test('writeVmBackupMetadata() records an `add` event', async () => {
    const path = await writeFullBackup()

    const entries = await adapter.readBackupJournal(0)
    assert.equal(entries.length, 1)

    const { date, timestamp, _filename, ...entry } = entries[0]
    assert.deepEqual(entry, {
      event: 'add',
      vmUuid,
      filename: path,
      who: { jobId, scheduleId },
      reason: 'backup',
    })
    assert.equal(date.getTime(), timestamp)
    assert.equal(_filename, (await listJournal())[0])
  })

  test('the entry is stored in the directory of its day, named after the date, the event and the backup', async () => {
    const path = await writeFullBackup()

    const [entryPath] = await listJournal()
    const { timestamp } = (await adapter.readBackupJournal(0))[0]

    const name = entryPath.split('/').pop()
    assert.equal(entryPath, `/${BACKUP_JOURNAL_DIR}/${formatJournalDay(timestamp)}/${name}`)
    assert.equal(name.slice(0, 20), formatJournalDate(timestamp))
    assert.ok(name.endsWith(`-add-${vmUuid}-${path.split('/').pop()}`), name)
  })

  test('deleting a backup records a `del` event', async () => {
    const full = await writeFullBackup(Date.now() - 2000)
    const delta = await writeDeltaBackup(Date.now() - 1000)

    const since = await mark()
    await adapter.deleteVmBackups([full, delta])

    const entries = await adapter.readBackupJournal(since)
    assert.deepEqual(
      entries
        .map(({ event, filename, vmUuid, reason, who }) => ({ event, filename, vmUuid, reason, who }))
        .sort(byFilename),
      [
        { event: 'del', filename: full, vmUuid, reason: 'user', who: { jobId, scheduleId } },
        { event: 'del', filename: delta, vmUuid, reason: 'user', who: { jobId, scheduleId } },
      ].sort(byFilename)
    )
  })

  test('deleting a backup through the retention path records the `retention` reason', async () => {
    await writeDeltaBackup()
    const [backup] = await adapter.listVmBackups(vmUuid)

    const since = await mark()
    await adapter.deleteDeltaVmBackups([backup])

    const entries = await adapter.readBackupJournal(since)
    assert.equal(entries.length, 1)
    assert.equal(entries[0].event, 'del')
    assert.equal(entries[0].reason, 'retention')
  })

  test('deleting an already deleted backup still records a `del` event', async () => {
    const path = await writeFullBackup()
    await handler.unlink(path)

    const since = await mark()
    await adapter.deleteVmBackup(path)

    const entries = await adapter.readBackupJournal(since)
    assert.equal(entries.length, 1)
    assert.equal(entries[0].event, 'del')
    assert.equal(entries[0].filename, path)
    assert.equal(entries[0].vmUuid, vmUuid)
    assert.equal(entries[0].who, undefined)
  })

  test('a merge records a `change` event, and cleaning an incomplete backup a `del` one', async () => {
    // an incomplete delta backup: its disk is missing
    await handler.outputFile(
      `/${rootPath}/incomplete.json`,
      JSON.stringify({ mode: 'delta', vhds: { vdi: `${relativePath}/gone.vhd` }, vdis: { vdi: {} } })
    )

    // a complete one whose disk has an orphan ancestor to merge
    const parent = await generateVhd(`${basePath}/parent.vhd`, { blocks: [0] })
    await generateVhd(`${basePath}/child.vhd`, {
      header: { parentUnicodeName: 'parent.vhd', parentUuid: parent.footer.uuid },
      blocks: [1],
    })
    await handler.outputFile(
      `/${rootPath}/complete.json`,
      JSON.stringify({ mode: 'delta', vhds: { vdi: `${relativePath}/child.vhd` }, vdis: { vdi: {} }, size: 1 })
    )

    const since = await mark()
    const result = await adapter.cleanVm(rootPath, {
      remove: true,
      merge: true,
      logInfo: noop,
      logWarn: noop,
      lock: false,
    })
    assert.ok(result.size > 0, 'nothing was merged')

    const entries = await adapter.readBackupJournal(since)
    assert.deepEqual(
      entries.map(({ event, filename, vmUuid, reason }) => ({ event, filename, vmUuid, reason })).sort(byFilename),
      [
        { event: 'change', filename: `/${rootPath}/complete.json`, vmUuid, reason: 'merge' },
        { event: 'del', filename: `/${rootPath}/incomplete.json`, vmUuid, reason: 'clean-vm' },
      ]
    )
  })

  test('a dry run of cleanVm() records nothing', async () => {
    await handler.outputFile(
      `/${rootPath}/incomplete.json`,
      JSON.stringify({ mode: 'delta', vhds: { vdi: `${relativePath}/gone.vhd` }, vdis: { vdi: {} } })
    )

    const since = await mark()
    await adapter.cleanVm(rootPath, { remove: false, logInfo: noop, logWarn: noop, lock: false })

    assert.deepEqual(await adapter.readBackupJournal(since), [])
  })

  test('a failure to journal does not fail the operation it journals', async () => {
    const outputFile = handler._outputFile.bind(handler)
    handler._outputFile = async (path, ...rest) => {
      if (path.startsWith(`/${BACKUP_JOURNAL_DIR}/`)) {
        const error = new Error('EACCES: permission denied')
        error.code = 'EACCES'
        throw error
      }
      return outputFile(path, ...rest)
    }

    const path = await writeFullBackup()

    assert.ok(await handler.getSize(path))
    assert.deepEqual(await listJournal(), [])
  })
})

describe('readBackupJournal()', { concurrency: 1 }, () => {
  const DAY = 24 * 60 * 60 * 1e3

  test('returns nothing on a repository without a journal', async () => {
    assert.deepEqual(await adapter.readBackupJournal(0), [])
  })

  test('replays the days since `since`, oldest first', async () => {
    const old = `/${rootPath}/old.json`
    const twoDaysAgo = Date.now() - 2 * DAY
    await writeJournalEntryAt(twoDaysAgo, { event: 'add', vmUuid, filename: old, reason: 'backup' })
    const recent = await writeFullBackup()

    assert.deepEqual(
      (await adapter.readBackupJournal(twoDaysAgo - 1000)).map(_ => _.filename),
      [old, recent]
    )
  })

  test('does not read the days older than `since`', async () => {
    await writeJournalEntryAt(Date.now() - 2 * DAY, {
      event: 'add',
      vmUuid,
      filename: `/${rootPath}/old.json`,
      reason: 'backup',
    })
    const recent = await writeFullBackup()

    const listed = []
    const list = handler.list.bind(handler)
    handler.list = (dir, ...rest) => {
      listed.push(dir)
      return list(dir, ...rest)
    }

    const since = Date.now() - 60e3
    assert.deepEqual(
      (await adapter.readBackupJournal(since)).map(_ => _.filename),
      [recent]
    )

    // only the journal root and today's directory, whatever the number of days the journal holds
    assert.deepEqual(listed, [`/${BACKUP_JOURNAL_DIR}`, `/${BACKUP_JOURNAL_DIR}/${formatJournalDay(since)}`])
  })

  test('returns the entries stamped after `since`, oldest first', async () => {
    const first = await writeFullBackup(Date.now() - 2000)
    const since = await mark()
    const second = await writeDeltaBackup(Date.now() - 1000)

    assert.deepEqual(
      (await adapter.readBackupJournal(0)).map(_ => _.filename),
      [first, second]
    )
    assert.deepEqual(
      (await adapter.readBackupJournal(since)).map(_ => _.filename),
      [second]
    )
    assert.deepEqual(await adapter.readBackupJournal(Date.now() + 1000), [])
  })

  test('skips truncated entries and unrecognized filenames without hiding their siblings', async () => {
    const path = await writeFullBackup()
    const [entryPath] = await listJournal()
    const day = formatJournalDay(Date.now())

    // a partially written entry
    await handler.writeFile(
      `/${BACKUP_JOURNAL_DIR}/${day}/${formatJournalDate(Date.now())}-000000-add-${vmUuid}-truncated.json`,
      '{"ev'
    )
    // a file which is not a journal entry at all
    await handler.writeFile(`/${BACKUP_JOURNAL_DIR}/${day}/README`, 'hello')
    // a stray file where only day directories are expected
    await handler.writeFile(`/${BACKUP_JOURNAL_DIR}/README`, 'hello')

    const entries = await adapter.readBackupJournal(0)
    assert.deepEqual(
      entries.map(_ => _.filename),
      [path]
    )
    assert.equal(entries[0]._filename, entryPath)
  })
})

describe('backup journal on an encrypted remote', { concurrency: 1 }, () => {
  test('entries are readable without the encryption key', async () => {
    const encryptedDir = await pFromCallback(cb => tmp.dir(cb))
    const encryptedHandler = getHandler({
      url: `file://${encryptedDir}?encryptionKey="73c1838d7d8a6088ca2317fb5f29cd00"`,
    })
    try {
      await encryptedHandler.sync()
      assert.equal(encryptedHandler.isEncrypted, true)

      const encryptedAdapter = new RemoteAdapter(encryptedHandler)
      await encryptedAdapter.writeVmBackupMetadata(vmUuid, {
        mode: 'full',
        vm: { uuid: vmUuid },
        jobId,
        scheduleId,
        timestamp: Date.now(),
      })

      const [day] = await encryptedHandler.list(`/${BACKUP_JOURNAL_DIR}`)
      const [name] = await encryptedHandler.list(`/${BACKUP_JOURNAL_DIR}/${day}`)
      const raw = await fs.readFile(`${encryptedDir}/${BACKUP_JOURNAL_DIR}/${day}/${name}`)
      assert.equal(JSON.parse(String(raw)).event, 'add')
    } finally {
      await encryptedHandler.forget()
      await rimraf(encryptedDir)
    }
  })
})
