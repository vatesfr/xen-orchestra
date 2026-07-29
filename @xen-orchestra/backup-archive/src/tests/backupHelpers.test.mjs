import test from 'node:test'
import { strict as assert } from 'node:assert'

/* eslint-disable n/no-missing-import */
import { BACKUP_DIR, getVmBackupDir } from '../paths.mjs'
import { formatFilenameDate, parseFilenameDate } from '../filenameDate.mjs'
import { isMetadataFile, isVhdFile, isVhdSumFile, isXvaFile, isXvaSumFile } from '../backupType.mjs'
/* eslint-enable n/no-missing-import */

const { describe } = test

describe('paths', () => {
  test('getVmBackupDir is a VM directory under the backup root', () => {
    assert.equal(BACKUP_DIR, 'xo-vm-backups')
    assert.equal(
      getVmBackupDir('05782c6b-8fbf-4b4f-9d7a-c1a0e0ba0a5f'),
      'xo-vm-backups/05782c6b-8fbf-4b4f-9d7a-c1a0e0ba0a5f'
    )
  })
})

describe('filenameDate', () => {
  // 2024-01-02T03:04:05Z
  const TIMESTAMP = Date.UTC(2024, 0, 2, 3, 4, 5)
  const FILENAME = '20240102T030405Z'

  // a local-time formatter would yield another string in any non-UTC timezone
  test('formatFilenameDate formats a timestamp in UTC', () => {
    assert.equal(formatFilenameDate(TIMESTAMP), FILENAME)
  })

  test('parseFilenameDate is the inverse of formatFilenameDate', () => {
    assert.equal(parseFilenameDate(FILENAME).getTime(), TIMESTAMP)
    assert.equal(formatFilenameDate(parseFilenameDate(FILENAME)), FILENAME)
  })

  test('parseFilenameDate returns null on an invalid filename', () => {
    assert.equal(parseFilenameDate('not-a-date'), null)
    assert.equal(parseFilenameDate('20240102'), null)
  })
})

describe('backupType', () => {
  test('recognizes the files of a backup directory', () => {
    const CASES = {
      // filename: [metadata, vhd, vhdSum, xva, xvaSum]
      '20240102T030405Z.json': [true, false, false, false, false],
      'disk.vhd': [false, true, false, false, false],
      'disk.alias.vhd': [false, true, false, false, false],
      'disk.vhd.checksum': [false, false, true, false, false],
      'backup.xva': [false, false, false, true, false],
      'backup.xva.checksum': [false, false, false, false, true],
      'cache.json.gz': [false, false, false, false, false],
      vdis: [false, false, false, false, false],
    }

    const actual = {}
    for (const filename of Object.keys(CASES)) {
      actual[filename] = [
        isMetadataFile(filename),
        isVhdFile(filename),
        isVhdSumFile(filename),
        isXvaFile(filename),
        isXvaSumFile(filename),
      ]
    }
    assert.deepEqual(actual, CASES)
  })
})
