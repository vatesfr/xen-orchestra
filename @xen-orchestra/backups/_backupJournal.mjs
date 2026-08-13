import { asyncEach } from '@vates/async-each'
import { basename, normalize } from '@xen-orchestra/fs/path'
import { createLogger } from '@xen-orchestra/log'
import { randomBytes } from 'node:crypto'
import { utcFormat, utcParse } from 'd3-time-format'

const { debug, warn } = createLogger('xo:backups:backupJournal')

// Append-only event log of the backups present on a repository.
//
// Entries are never modified nor overwritten, which makes the journal usable on immutable
// (Object Lock) repositories, where `cache.json.gz` cannot be rewritten.
export const BACKUP_JOURNAL_DIR = 'xo-backup-log'

// Same idea as `formatFilenameDate` but with milliseconds, so that two events on the same VM
// within the same second keep distinct, ordered names.
export const formatJournalDate = utcFormat('%Y%m%dT%H%M%S.%LZ')
export const parseJournalDate = utcParse('%Y%m%dT%H%M%S.%LZ')

// the date part has a fixed width, therefore sorting entry names lexicographically sorts them
// chronologically
const DATE_LENGTH = formatJournalDate(0).length

// `YYYYMMDD`, the leading part of a formatted date
const DAY_LENGTH = 8

const dayOfDate = date => date.slice(0, DAY_LENGTH)

export const formatJournalDay = timestamp => dayOfDate(formatJournalDate(timestamp))

const isDayName = name => /^\d{8}$/.test(name)

// `/xo-backup-log/<day>/<date>-<random>-<event>-<vmUuid>-<metadata filename>`
//
// Entries are grouped in one directory per UTC day, so that a reader lists only the days it is
// missing instead of the whole history of the repository, and a purge removes whole directories.
//
// Everything after the date is only there to make the journal readable by a human: the date is read
// back from the name, all the other fields are read back from the entry itself.
function getEntryPath({ date, event, vmUuid, filename }) {
  const unique = randomBytes(3).toString('hex')
  return `/${BACKUP_JOURNAL_DIR}/${dayOfDate(date)}/${date}-${unique}-${event}-${vmUuid}-${basename(filename)}`
}

/**
 * Appends an event to the journal.
 *
 * Never rejects: journaling is best effort, a failure here must not fail the backup or the deletion
 * that triggered it. The resulting drift is bounded by the periodic full rebuild of the readers.
 *
 * @param {object} entry
 * @param {'add'|'change'|'del'} entry.event
 * @param {string} entry.vmUuid
 * @param {string} entry.filename path of the backup metadata this event is about
 * @param {object} [entry.who] ids of the XO entities responsible for the event
 * @param {string} [entry.reason]
 */
export async function writeBackupJournalEntry(handler, { event, vmUuid, filename, who, reason }, { dirMode } = {}) {
  const timestamp = Date.now()
  const path = getEntryPath({ date: formatJournalDate(timestamp), event, vmUuid, filename })
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

export async function writeBackupJournalEntries(handler, entries, opts) {
  await asyncEach(entries, entry => writeBackupJournalEntry(handler, entry, opts))
}

/**
 * Reads the journal entries stamped after `since`, oldest first.
 *
 * Corrupt or partially written entries are skipped, they must not hide their siblings. Computing the
 * watermark to pass as `since` on the next call is the caller's responsibility.
 *
 * @param {number} [since] timestamp in ms
 */
export async function readBackupJournal(handler, since = 0) {
  const minDate = formatJournalDate(since)

  // only the days which can hold entries newer than `since` are listed, therefore the cost of a read
  // does not grow with the whole history of the repository
  const days = (
    await handler.list(`/${BACKUP_JOURNAL_DIR}`, {
      filter: name => isDayName(name) && name >= dayOfDate(minDate),
      ignoreMissing: true,
    })
  ).sort()

  const paths = []
  for (const day of days) {
    paths.push(
      ...(await handler.list(`/${BACKUP_JOURNAL_DIR}/${day}`, {
        filter: name => name.slice(0, DATE_LENGTH) > minDate,
        ignoreMissing: true,
        prependDir: true,
      }))
    )
  }

  const entries = []
  await asyncEach(paths, async path => {
    const date = parseJournalDate(basename(path).slice(0, DATE_LENGTH))
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
