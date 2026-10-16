import { describe, it } from 'node:test'
import { strict as assert } from 'node:assert'
import { BackupRepositoryUrlInput, ParsedBackupRepositoryUrl } from './index'
import { parse } from './parse'
import { format } from './format'

type ParseCase = { name: string; url: string; object: ParsedBackupRepositoryUrl }
type FormatCase = { name: string; url: string; object: BackupRepositoryUrlInput }

// Shared cases are valid in both directions, so they must satisfy both types
type SharedCase = ParseCase & FormatCase

// Data used for both parse and format (i.e. correctly formatted).
const sharedCases: SharedCase[] = [
  {
    name: 'file',
    url: 'file:///var/lib/xoa/backup?diskFormat=%22vhd%22',
    object: { type: 'file', path: '/var/lib/xoa/backup', diskFormat: 'vhd' },
  },
  {
    name: 'file with vhd directory disk format',
    url: 'file:///var/lib/xoa/backup?diskFormat=%22vhdDirectory%22',
    object: { type: 'file', path: '/var/lib/xoa/backup', diskFormat: 'vhdDirectory' },
  },
  {
    name: 'file with hbd disk format',
    url: 'file:///var/lib/xoa/backup?diskFormat=%22hbd%22',
    object: { type: 'file', path: '/var/lib/xoa/backup', diskFormat: 'hbd' },
  },
  {
    name: 'SMB',
    url: 'smb://Administrator:pas:sw@ord@toto\\\\192.168.100.225\\smb\0?diskFormat=%22vhd%22',
    object: {
      type: 'smb',
      host: '192.168.100.225\\smb',
      path: '',
      domain: 'toto',
      username: 'Administrator',
      password: 'pas:sw@ord',
      diskFormat: 'vhd',
    },
  },
  {
    name: 'smb with vhd directory disk format',
    url: 'smb://Administrator:pas:sw@ord@toto\\\\192.168.100.225\\smb\0?diskFormat=%22vhdDirectory%22',
    object: {
      type: 'smb',
      host: '192.168.100.225\\smb',
      path: '',
      domain: 'toto',
      username: 'Administrator',
      password: 'pas:sw@ord',
      diskFormat: 'vhdDirectory',
    },
  },
  {
    name: 'NFS',
    url: 'nfs://192.168.100.225:/media/nfs?diskFormat=%22vhd%22',
    object: { type: 'nfs', host: '192.168.100.225', port: undefined, path: '/media/nfs', diskFormat: 'vhd' },
  },
  {
    name: 'nfs with port',
    url: 'nfs://192.168.100.225:20:/media/nfs?diskFormat=%22vhd%22',
    object: { type: 'nfs', host: '192.168.100.225', port: '20', path: '/media/nfs', diskFormat: 'vhd' },
  },
  {
    name: 'nfs with vhd directory disk format',
    url: 'nfs://192.168.100.225:20:/media/nfs?diskFormat=%22vhdDirectory%22',
    object: { type: 'nfs', host: '192.168.100.225', port: '20', path: '/media/nfs', diskFormat: 'vhdDirectory' },
  },
  {
    name: 'S3',
    url: 's3://AKIAS:XSuBupZ0mJlu%2B@s3-us-west-2.amazonaws.com/test-bucket/dir?allowUnauthorized=false&diskFormat=%22vhd%22',
    object: {
      type: 's3',
      protocol: 'https',
      host: 's3-us-west-2.amazonaws.com',
      path: '/test-bucket/dir',
      username: 'AKIAS',
      password: 'XSuBupZ0mJlu+',
      region: undefined,
      allowUnauthorized: false,
      diskFormat: 'vhd',
    },
  },
  {
    name: 's3 accepting self signed',
    url: 's3://AKIAS:XSuBupZ0mJlu%2B@s3-us-west-2.amazonaws.com/test-bucket/dir?allowUnauthorized=true&diskFormat=%22vhd%22',
    object: {
      type: 's3',
      protocol: 'https',
      host: 's3-us-west-2.amazonaws.com',
      path: '/test-bucket/dir',
      username: 'AKIAS',
      password: 'XSuBupZ0mJlu+',
      region: undefined,
      allowUnauthorized: true,
      diskFormat: 'vhd',
    },
  },
  {
    name: 'S3 with brotli',
    url: 's3+http://Administrator:password@192.168.100.225/bucket/dir?compressionType=%22brotli%22&compressionOptions=%7B%22level%22%3A1%7D&diskFormat=%22vhd%22#reg1',
    object: {
      type: 's3',
      host: '192.168.100.225',
      protocol: 'http',
      path: '/bucket/dir',
      region: 'reg1',
      username: 'Administrator',
      password: 'password',
      compressionType: 'brotli',
      compressionOptions: { level: 1 },
      diskFormat: 'vhd',
    },
  },
  {
    name: 'S3 with 2 points',
    url: 's3://a%40b%2Fc%2Bd%3Ae%3D%3A%2F%2F%20:e%40d%2Fc%2Bb%3Aa%3Ds%3A%2F%2F%20@s3-us-west-2.amazonaws.com/test-bucket/dir?allowUnauthorized=false&diskFormat=%22vhd%22',
    object: {
      type: 's3',
      protocol: 'https',
      host: 's3-us-west-2.amazonaws.com',
      path: '/test-bucket/dir',
      username: 'a@b/c+d:e=:// ',
      password: 'e@d/c+b:a=s:// ',
      region: undefined,
      allowUnauthorized: false,
      diskFormat: 'vhd',
    },
  },
  {
    name: 'AZURE',
    url: 'azure://username:%2FpAssWord%3D%3D@username.blob.core.windows.net/xodev/newfolder/from/bob?diskFormat=%22vhd%22',
    object: {
      type: 'azure',
      host: 'username.blob.core.windows.net',
      protocol: 'https',
      port: '',
      path: '/xodev/newfolder/from/bob',
      username: 'username',
      password: '/pAssWord==',
      diskFormat: 'vhd',
    },
  },
  {
    name: 'azurite https',
    url: 'azurite://devstoreaccount1:Eby8vdM02xNOcqFlqUwJPLlmEtlCDXJ1OUzFT50uSRZ6IFsuFq2UVErCz4I6tq%2FK1SZFPTOtr%2FKBHBeksoGMGw%3D%3D@127.0.0.1:10000/xodevtest/folder/subfolder?diskFormat=%22vhd%22',
    object: {
      type: 'azurite',
      host: '127.0.0.1:10000',
      port: '10000',
      protocol: 'https',
      path: '/xodevtest/folder/subfolder',
      username: 'devstoreaccount1',
      password: 'Eby8vdM02xNOcqFlqUwJPLlmEtlCDXJ1OUzFT50uSRZ6IFsuFq2UVErCz4I6tq/K1SZFPTOtr/KBHBeksoGMGw==',
      diskFormat: 'vhd',
    },
  },
  {
    name: 'azurite http',
    url: 'azurite+http://devstoreaccount1:Eby8vdM02xNOcqFlqUwJPLlmEtlCDXJ1OUzFT50uSRZ6IFsuFq2UVErCz4I6tq%2FK1SZFPTOtr%2FKBHBeksoGMGw%3D%3D@127.0.0.1:10000/xodevtest/folder/subfolder?diskFormat=%22vhd%22',
    object: {
      type: 'azurite',
      host: '127.0.0.1:10000',
      port: '10000',
      protocol: 'http',
      path: '/xodevtest/folder/subfolder',
      username: 'devstoreaccount1',
      password: 'Eby8vdM02xNOcqFlqUwJPLlmEtlCDXJ1OUzFT50uSRZ6IFsuFq2UVErCz4I6tq/K1SZFPTOtr/KBHBeksoGMGw==',
      diskFormat: 'vhd',
    },
  },
]

// URLs accepted on parsing but never produced by format (legacy or malformed input)
const parseCases: ParseCase[] = [
  ...sharedCases,
  {
    name: 'legacy file without disk format',
    url: 'file:///var/lib/xoa/backup',
    object: { type: 'file', path: '/var/lib/xoa/backup', diskFormat: 'vhd' },
  },
  {
    name: 'legacy file with use vhd directory',
    url: 'file:///var/lib/xoa/backup?useVhdDirectory=true',
    object: { type: 'file', path: '/var/lib/xoa/backup', useVhdDirectory: true, diskFormat: 'vhdDirectory' },
  },
  {
    name: 'legacy nfs with use vhd directory',
    url: 'nfs://192.168.100.225:20:/media/nfs?useVhdDirectory=true',
    object: {
      type: 'nfs',
      host: '192.168.100.225',
      port: '20',
      path: '/media/nfs',
      useVhdDirectory: true,
      diskFormat: 'vhdDirectory',
    },
  },
  {
    name: 'legacy smb with use vhd directory',
    url: 'smb://Administrator:pas:sw@ord@toto\\\\192.168.100.225\\smb\0?useVhdDirectory=true',
    object: {
      type: 'smb',
      host: '192.168.100.225\\smb',
      path: '',
      domain: 'toto',
      username: 'Administrator',
      password: 'pas:sw@ord',
      useVhdDirectory: true,
      diskFormat: 'vhdDirectory',
    },
  },
  {
    name: 'legacy file with use vhd directory set to false',
    url: 'file:///var/lib/xoa/backup?useVhdDirectory=false',
    object: { type: 'file', path: '/var/lib/xoa/backup', useVhdDirectory: false, diskFormat: 'vhd' },
  },
  {
    name: 'disk format takes precedence over use vhd directory',
    url: 'file:///var/lib/xoa/backup?useVhdDirectory=true&diskFormat=%22hbd%22',
    object: { type: 'file', path: '/var/lib/xoa/backup', useVhdDirectory: true, diskFormat: 'hbd' },
  },
  {
    name: 'disk format without JSON quotes',
    url: 'file:///var/lib/xoa/backup?diskFormat=vhdDirectory',
    object: { type: 'file', path: '/var/lib/xoa/backup', diskFormat: 'vhdDirectory' },
  },
  {
    name: 'file with missing leading slash (#7)',
    url: 'file://var/lib/xoa/backup',
    object: { type: 'file', path: '/var/lib/xoa/backup', diskFormat: 'vhd' },
  },
  {
    name: 'nfs with missing leading slash',
    url: 'nfs://192.168.100.225:media/nfs',
    object: { type: 'nfs', host: '192.168.100.225', port: undefined, path: '/media/nfs', diskFormat: 'vhd' },
  },
  {
    name: 'SMB with missing path',
    url: 'smb://Administrator:pas:sw@ord@toto\\\\192.168.100.225\\smb',
    object: {
      type: 'smb',
      host: '192.168.100.225\\smb',
      path: '',
      domain: 'toto',
      username: 'Administrator',
      password: 'pas:sw@ord',
      diskFormat: 'vhd',
    },
  },
  {
    name: 'S3 with http and region',
    url: 's3+http://Administrator:password@192.168.100.225/bucket/dir#reg1',
    object: {
      type: 's3',
      host: '192.168.100.225',
      protocol: 'http',
      path: '/bucket/dir',
      region: 'reg1',
      username: 'Administrator',
      password: 'password',
      diskFormat: 'vhd',
    },
  },
  {
    name: 'S3 accepting self signed certificate',
    url: 's3+http://Administrator:password@192.168.100.225/bucket/dir?allowUnauthorized=true#reg1',
    object: {
      type: 's3',
      host: '192.168.100.225',
      protocol: 'http',
      path: '/bucket/dir',
      region: 'reg1',
      username: 'Administrator',
      password: 'password',
      allowUnauthorized: true,
      diskFormat: 'vhd',
    },
  },
  {
    name: 's3 with empty region',
    url: 's3://AKIAS:XSuBupZ0mJlu%2B@s3-us-west-2.amazonaws.com/test-bucket/dir#',
    object: {
      type: 's3',
      protocol: 'https',
      host: 's3-us-west-2.amazonaws.com',
      path: '/test-bucket/dir',
      username: 'AKIAS',
      password: 'XSuBupZ0mJlu+',
      region: undefined,
      diskFormat: 'vhd',
    },
  },
]

const formatCases: FormatCase[] = [
  ...sharedCases,
  {
    name: 'file with local type',
    url: 'file:///var/lib/xoa/backup',
    object: { type: 'local', path: '/var/lib/xoa/backup' },
  },
]

describe('parse url', () => {
  for (const { name, url, object } of sharedCases) {
    it(name, () => {
      assert.deepEqual(parse(url), object)
    })
  }
})

describe('parse with url never produced by format (legacy or malformed input)', () => {
  for (const { name, url, object } of parseCases) {
    it(name, () => {
      assert.deepEqual(parse(url), object)
    })
  }
})

describe('format url', () => {
  for (const { name, url, object } of formatCases) {
    it(name, () => {
      assert.equal(format(object), url)
    })
  }
})

describe('parse (unrecognized input)', () => {
  it('returns an empty object on unknown scheme', () => {
    assert.deepEqual(parse('ftp://192.168.100.225/backup'), {})
  })

  it('returns an error on unparsable SMB url', () => {
    assert.deepEqual(parse('smb://not-a-valid-smb-url'), {})
  })

  it('returns an empty object on an SMB url without credentials', () => {
    assert.deepEqual(parse('smb://:password@toto\\\\192.168.100.225\\smb'), {})
  })

  it('keeps a non-JSON option value as a string', () => {
    assert.deepEqual(parse('file:///var/lib/xoa/backup?encryptionKey=notjson'), {
      type: 'file',
      path: '/var/lib/xoa/backup',
      encryptionKey: 'notjson',
      diskFormat: 'vhd',
    })
  })
})

describe('format path sanitizing', () => {
  it('keeps spaces inside a path segment', () => {
    assert.equal(format({ type: 'file', path: '/backups/toto tata' }), 'file:///backups/toto tata')
  })

  it('trims spaces around path segments', () => {
    assert.equal(format({ type: 'file', path: '/backups/  toto tata  ' }), 'file:///backups/toto tata')
  })

  it('drops empty segments', () => {
    assert.equal(format({ type: 'file', path: '//backups///dir/' }), 'file:///backups/dir')
  })

  it('sanitizes the path of every type', () => {
    assert.equal(format({ type: 'nfs', host: 'h', path: ' /a b / c ' }), 'nfs://h:/a b/c')
    assert.equal(
      format({ type: 's3', host: 'h', username: 'u', password: 'p', protocol: 'https', path: ' /a b / c ' }),
      's3://u:p@h/a b/c'
    )
  })

  it('round-trips a path with an inner space', () => {
    const url = format({ type: 'file', path: '/backups/toto tata' })

    assert.deepEqual(parse(url), { type: 'file', path: '/backups/toto tata', diskFormat: 'vhd' })
  })
})
