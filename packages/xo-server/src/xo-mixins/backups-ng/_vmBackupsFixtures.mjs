// Fixtures shared by the `backups-ng` suites. Not a suite itself: the name carries no `.test.`
// segment, so `node --test` does not pick it up.

import { BACKUP_JOURNAL_DIR, formatJournalDay, formatJournalTime } from '@xen-orchestra/backups/_backupJournal.mjs'

export const VM = 'a-vm-uuid'
export const OTHER_VM = 'another-vm-uuid'

// `RemoteAdapter` lists and writes the metadata with a leading slash
export const filenameOf = (vmUuid, name) => `/xo-vm-backups/${vmUuid}/${name}.json`

export const metadataOf = (vmUuid, name, props) => ({
  _filename: filenameOf(vmUuid, name),
  jobId: 'a-job-id',
  mode: 'full',
  scheduleId: 'a-schedule-id',
  size: 1,
  timestamp: Date.parse(`${name}Z`),
  vm: { uuid: vmUuid, name_label: 'a VM', name_description: '', tags: [] },
  ...props,
})

// a real, sortable path, like the one a real journal entry would get: the cursor bootstrapped by
// `VmBackupsCache#build()` is in this same day/time format, and comparisons between the two must
// make sense
let journalSeq = 0
export const journalEntryPath = date =>
  `/${BACKUP_JOURNAL_DIR}/${formatJournalDay(date)}/${formatJournalTime(date)}-${String(journalSeq++).padStart(6, '0')}`
