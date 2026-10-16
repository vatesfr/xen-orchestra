import {
  getBackupFormatFromDiskFormat,
  getDiskFormatFromBackupFormat,
  getDiskFormatFromUrl,
  isBackupRepositoryUsingVhdDirectory,
} from '@/modules/backup-repository/utils/xo-backup-repository-disk-format.util.ts'
import { parse as parseBackupRepositoryUrl } from 'xo-remote-parser'

describe('getDiskFormatFromBackupFormat', () => {
  it.each([
    ['block', 'vhdDirectory'],
    ['vhd', 'vhd'],
    ['hbd', 'hbd'],
  ] as const)('stores the %s backup format as the %s disk format', (backupFormat, diskFormat) => {
    expect(getDiskFormatFromBackupFormat(backupFormat)).toBe(diskFormat)
  })
})

describe('getBackupFormatFromDiskFormat', () => {
  it.each([
    ['vhdDirectory', 'block'],
    ['vhd', 'vhd'],
    ['hbd', 'hbd'],
  ] as const)('reads the %s disk format as the %s backup format', (diskFormat, backupFormat) => {
    expect(getBackupFormatFromDiskFormat(diskFormat)).toBe(backupFormat)
  })
})

describe('getDiskFormatFromUrl', () => {
  it.each([
    ['nfs://192.168.1.10:/exports/backups?diskFormat=%22vhd%22', 'vhd'],
    ['nfs://192.168.1.10:/exports/backups?diskFormat=%22vhdDirectory%22', 'vhdDirectory'],
    ['nfs://192.168.1.10:/exports/backups?diskFormat=%22hbd%22', 'hbd'],
  ] as const)('reads the disk format of %s', (url, diskFormat) => {
    expect(getDiskFormatFromUrl(parseBackupRepositoryUrl(url))).toBe(diskFormat)
  })

  it('reads a legacy repository using VHD directories as the VHD directory disk format', () => {
    const parsedUrl = parseBackupRepositoryUrl('nfs://192.168.1.10:/exports/backups?useVhdDirectory=true')

    expect(getDiskFormatFromUrl(parsedUrl)).toBe('vhdDirectory')
  })

  it('reads a legacy repository without disk format as the VHD disk format', () => {
    const parsedUrl = parseBackupRepositoryUrl('nfs://192.168.1.10:/exports/backups')

    expect(getDiskFormatFromUrl(parsedUrl)).toBe('vhd')
  })

  it('prefers the disk format over the legacy VHD directories option', () => {
    const parsedUrl = parseBackupRepositoryUrl(
      'nfs://192.168.1.10:/exports/backups?useVhdDirectory=true&diskFormat=%22hbd%22'
    )

    expect(getDiskFormatFromUrl(parsedUrl)).toBe('hbd')
  })
})

describe('isBackupRepositoryUsingVhdDirectory', () => {
  it.each([
    ['nfs://192.168.1.10:/exports/backups?diskFormat=%22vhdDirectory%22', true],
    ['nfs://192.168.1.10:/exports/backups?useVhdDirectory=true', true],
    ['nfs://192.168.1.10:/exports/backups?diskFormat=%22vhd%22', false],
    ['nfs://192.168.1.10:/exports/backups?diskFormat=%22hbd%22', false],
    ['nfs://192.168.1.10:/exports/backups', false],
  ] as const)('tells whether %s uses VHD directories', (url, expected) => {
    expect(isBackupRepositoryUsingVhdDirectory(parseBackupRepositoryUrl(url))).toBe(expected)
  })
})
