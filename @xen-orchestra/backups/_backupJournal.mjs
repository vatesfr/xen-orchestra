// @ts-check

import { asyncEach } from '@vates/async-each'
import { basename, normalize } from '@xen-orchestra/fs/path'
import { createLogger } from '@xen-orchestra/log'
import { randomBytes } from 'node:crypto'
import { utcFormat, utcParse } from 'd3-time-format'

const { debug, warn } = createLogger('xo:backups:backupJournal')

/**
 * A remote handler, plus the two unencrypted read/write primitives this module relies on to keep
 * the journal readable without the encryption key. They are not part of the handler's declared
 * public surface (`@xen-orchestra/fs/src/types/fs.mts`), hence the intersection.
 *
 * @typedef {import('@xen-orchestra/fs').RemoteHandlerAbstract & {
 *   _outputFile(file: string, data: string, opts?: { dirMode?: number, flags?: string }): Promise<void>
 *   _readFile(file: string): Promise<Buffer>
 * }} RemoteHandler
 */

/**
 * What happened to the backup metadata this entry is about.
 *
 * - `add`: the backup was written
 * - `change`: the metadata was rewritten in place, the backup itself still exists
 * - `del`: the backup was removed
 *
 * @typedef {'add'|'change'|'del'} BackupJournalEvent
 */

/**
 * What triggered the event.
 *
 * - `backup`: a backup job wrote it
 * - `retention`: it was rotated out by a retention setting
 * - `user`: a user explicitly deleted it
 * - `clean-vm`: `cleanVm()` removed it, e.g. the metadata of an incomplete backup
 * - `merge`: `cleanVm()` rewrote its size after merging its disks
 *
 * @typedef {'backup'|'retention'|'user'|'clean-vm'|'merge'} BackupJournalReason
 */

/**
 * The XO entities responsible for the event, when they are known.
 *
 * @typedef {object} BackupJournalWho
 * @property {string} [jobId]
 * @property {string} [scheduleId]
 */

/**
 * An event to append to the journal.
 *
 * @typedef {object} NewBackupJournalEntry
 * @property {BackupJournalEvent} event
 * @property {string} vmUuid
 * @property {string} filename path of the backup metadata this event is about
 * @property {BackupJournalWho} [who]
 * @property {BackupJournalReason} [reason]
 */

/**
 * An event read back from the journal: what was written, plus the fields derived from the entry
 * itself.
 *
 * `timestamp` is the writer's clock at the time of the write; `date` is that same instant, parsed
 * back from the entry name.
 *
 * @typedef {NewBackupJournalEntry & {
 *   timestamp: number
 *   date: Date
 *   _filename: string
 * }} BackupJournalEntry
 */

// Append-only event log of the backups present on a repository.
//
// Entries are never modified nor overwritten, which makes the journal usable on immutable
// (Object Lock) repositories, where `cache.json.gz` cannot be rewritten.
export const BACKUP_JOURNAL_DIR = 'xo-backup-log'

// Same idea as `formatFilenameDate` but with milliseconds, so that two events on the same VM
// within the same second keep distinct, ordered names.
const formatDate = utcFormat('%Y%m%dT%H%M%S.%LZ')

// the time part alone, which is what an entry is named after: its day is already the name of the
// directory holding it
const formatTime = utcFormat('%H%M%S.%LZ')

/**
 * Formats a timestamp into the date part of a journal entry name.
 *
 * Takes a timestamp rather than a `Date` because that is what every caller has; `d3-time-format`
 * would coerce it anyway, but its declared signature does not say so.
 *
 * @param {number} timestamp in ms
 * @returns {string}
 */
export const formatJournalDate = timestamp => formatDate(new Date(timestamp))

/**
 * Formats a timestamp into the day part of a journal entry path, i.e. the name of the directory
 * holding it.
 *
 * @param {number} timestamp in ms
 * @returns {string} `YYYYMMDD`
 */
export const formatJournalDay = timestamp => dayOfDate(formatJournalDate(timestamp))

/**
 * Formats a timestamp into the time part of a journal entry name.
 *
 * @param {number} timestamp in ms
 * @returns {string} `HHMMSS.mmmZ`
 */
export const formatJournalTime = timestamp => formatTime(new Date(timestamp))

/**
 * Reads back the date of a journal entry, from its day and the time part of its name.
 *
 * @param {string} date `YYYYMMDDTHHMMSS.mmmZ`, i.e. `<day>T<time>`
 * @returns {Date | null} `null` when the name is not a journal entry
 */
export const parseJournalDate = utcParse('%Y%m%dT%H%M%S.%LZ')

// `YYYYMMDDTHHMMSS.mmmZ`, a day and a time joined by a `T`
const DATE_LENGTH = formatJournalDate(0).length

// `YYYYMMDD`, the leading part of a formatted date
const DAY_LENGTH = 8

// `HHMMSS.mmmZ`, a formatted date without its day nor the `T` separating the two
//
// it has a fixed width, therefore sorting the entry names of a day lexicographically sorts them
// chronologically, and so does sorting whole paths across days
const TIME_LENGTH = DATE_LENGTH - DAY_LENGTH - 1

const dayOfDate = date => date.slice(0, DAY_LENGTH)

const isDayName = name => /^\d{8}$/.test(name)

// reassembles what `parseJournalDate()` expects from where each part is stored
const dateOfEntry = (day, name) => parseJournalDate(`${day}T${name.slice(0, TIME_LENGTH)}`)

// `/xo-backup-log/<day>/<time>-<random>-<event>-<vmUuid>-<metadata filename>`
//
// Entries are grouped in one directory per UTC day, so that a reader lists only the days it is
// missing instead of the whole history of the repository, and a purge removes whole directories.
// The day is therefore not repeated in the name: an entry is named after its time only.
//
// Everything after the time is only there to make the journal readable by a human: the date is read
// back from the day and the time, all the other fields are read back from the entry itself.
/**
 * @param {object} entry
 * @param {number} entry.timestamp the event date, in ms
 * @param {BackupJournalEvent} entry.event
 * @param {string} entry.vmUuid
 * @param {string} entry.filename path of the backup metadata this event is about
 * @returns {string} path of the journal entry, unique thanks to a random part
 */
function getEntryPath({ timestamp, event, vmUuid, filename }) {
  const unique = randomBytes(3).toString('hex')
  const name = `${formatJournalTime(timestamp)}-${unique}-${event}-${vmUuid}-${basename(filename)}`
  return `/${BACKUP_JOURNAL_DIR}/${formatJournalDay(timestamp)}/${name}`
}

/**
 * Appends an event to the journal.
 *
 * Never rejects: journaling is best effort, a failure here must not fail the backup or the deletion
 * that triggered it. The resulting drift is bounded by the periodic full rebuild of the readers.
 *
 * The entry is stamped with the writer's clock at the time of this call.
 *
 * @param {RemoteHandler} handler
 * @param {NewBackupJournalEntry} entry
 * @param {object} [opts]
 * @param {number} [opts.dirMode] mode of the journal directory, if it has to be created
 * @returns {Promise<void>}
 */
export async function writeBackupJournalEntry(handler, { event, vmUuid, filename, who, reason }, { dirMode } = {}) {
  const timestamp = Date.now()
  const path = getEntryPath({ timestamp, event, vmUuid, filename })
  try {
    // this file is not encrypted, so that it stays readable by tools which don't have the
    // encryption key (e.g. the `immutable-backups` daemon)
    await handler._outputFile(normalize(path), JSON.stringify({ event, vmUuid, filename, timestamp, who, reason }), {
      dirMode,
      flags: 'wx',
    })
    debug('journal entry written', { path })
  } catch (error) {
    warn('failed to write journal entry', { error, path })
  }
}

/**
 * Appends multiple events to the journal, concurrently.
 *
 * Never rejects, see `writeBackupJournalEntry()`. Entries are not written atomically as a group: a
 * reader can observe a subset of them.
 *
 * @param {RemoteHandler} handler
 * @param {NewBackupJournalEntry[]} entries
 * @param {object} [opts]
 * @param {number} [opts.dirMode] mode of the journal directory, if it has to be created
 * @returns {Promise<void>}
 */
export async function writeBackupJournalEntries(handler, entries, opts) {
  await asyncEach(entries, entry => writeBackupJournalEntry(handler, entry, opts))
}

/**
 * Reads the journal entries stamped after `since`, oldest first.
 *
 * Corrupt or partially written entries are skipped, they must not hide their siblings. Computing the
 * watermark to pass as `since` on the next call is the caller's responsibility.
 *
 * `since` is exclusive: entries stamped exactly at `since` are not returned.
 *
 * @param {RemoteHandler} handler
 * @param {number} [since] timestamp in ms
 * @returns {Promise<BackupJournalEntry[]>} oldest first
 */
export async function readBackupJournal(handler, since = 0) {
  const minDay = formatJournalDay(since)
  const minTime = formatJournalTime(since)

  // only the days which can hold entries newer than `since` are listed, therefore the cost of a read
  // does not grow with the whole history of the repository
  const days = (
    await handler.list(`/${BACKUP_JOURNAL_DIR}`, {
      filter: name => isDayName(name) && name >= minDay,
      ignoreMissing: true,
    })
  ).sort()

  /** @type {Array<{ day: string, path: string }>} */
  const found = []
  for (const day of days) {
    // entries are named after their time only: `since` bounds the day it falls into, every later
    // day is taken whole
    const names = await handler.list(`/${BACKUP_JOURNAL_DIR}/${day}`, {
      filter: day === minDay ? name => name.slice(0, TIME_LENGTH) > minTime : undefined,
      ignoreMissing: true,
    })
    for (const name of names) {
      found.push({ day, path: `/${BACKUP_JOURNAL_DIR}/${day}/${name}` })
    }
  }

  /** @type {BackupJournalEntry[]} */
  const entries = []
  await asyncEach(found, async ({ day, path }) => {
    const date = dateOfEntry(day, basename(path))
    if (date === null) {
      debug('ignoring unrecognized journal entry', { path })
      return
    }

    try {
      // this file is not encrypted
      entries.push({ ...JSON.parse(String(await handler._readFile(normalize(path)))), date, _filename: path })
    } catch (error) {
      warn(`can't read journal entry`, { error, path })
    }
  })

  // `asyncEach` does not preserve the order of its input
  entries.sort((a, b) => (a._filename < b._filename ? -1 : 1))

  return entries
}
