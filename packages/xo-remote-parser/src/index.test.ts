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
    url: 'file:///var/lib/xoa/backup',
    object: { type: 'file', path: '/var/lib/xoa/backup' },
  },
  {
    name: 'file with use vhd directory',
    url: 'file:///var/lib/xoa/backup?useVhdDirectory=true',
    object: { type: 'file', path: '/var/lib/xoa/backup', useVhdDirectory: true },
  },
  {
    name: 'SMB',
    url: 'smb://Administrator:pas:sw@ord@toto\\\\192.168.100.225\\smb\0',
    object: {
      type: 'smb',
      host: '192.168.100.225\\smb',
      path: '',
      domain: 'toto',
      username: 'Administrator',
      password: 'pas:sw@ord',
    },
  },
  {
    name: 'smb with directory',
    url: 'smb://Administrator:pas:sw@ord@toto\\\\192.168.100.225\\smb\0?useVhdDirectory=true',
    object: {
      type: 'smb',
      host: '192.168.100.225\\smb',
      path: '',
      domain: 'toto',
      username: 'Administrator',
      password: 'pas:sw@ord',
      useVhdDirectory: true,
    },
  },
  {
    name: 'NFS',
    url: 'nfs://192.168.100.225:/media/nfs',
    object: { type: 'nfs', host: '192.168.100.225', port: undefined, path: '/media/nfs' },
  },
  {
    name: 'nfs with port',
    url: 'nfs://192.168.100.225:20:/media/nfs',
    object: { type: 'nfs', host: '192.168.100.225', port: '20', path: '/media/nfs' },
  },
  {
    name: 'nfs with vhdDirectory',
    url: 'nfs://192.168.100.225:20:/media/nfs?useVhdDirectory=true',
    object: { type: 'nfs', host: '192.168.100.225', port: '20', path: '/media/nfs', useVhdDirectory: true },
  },
  {
    name: 'S3',
    url: 's3://AKIAS:XSuBupZ0mJlu%2B@s3-us-west-2.amazonaws.com/test-bucket/dir?allowUnauthorized=false',
    object: {
      type: 's3',
      protocol: 'https',
      host: 's3-us-west-2.amazonaws.com',
      path: '/test-bucket/dir',
      username: 'AKIAS',
      password: 'XSuBupZ0mJlu+',
      region: undefined,
      allowUnauthorized: false,
    },
  },
  {
    name: 's3 accepting self signed',
    url: 's3://AKIAS:XSuBupZ0mJlu%2B@s3-us-west-2.amazonaws.com/test-bucket/dir?allowUnauthorized=true',
    object: {
      type: 's3',
      protocol: 'https',
      host: 's3-us-west-2.amazonaws.com',
      path: '/test-bucket/dir',
      username: 'AKIAS',
      password: 'XSuBupZ0mJlu+',
      region: undefined,
      allowUnauthorized: true,
    },
  },
  {
    name: 'S3 with brotli',
    url: 's3+http://Administrator:password@192.168.100.225/bucket/dir?compressionType=%22brotli%22&compressionOptions=%7B%22level%22%3A1%7D#reg1',
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
    },
  },
  {
    name: 'S3 with 2 points',
    url: 's3://a%40b%2Fc%2Bd%3Ae%3D%3A%2F%2F%20:e%40d%2Fc%2Bb%3Aa%3Ds%3A%2F%2F%20@s3-us-west-2.amazonaws.com/test-bucket/dir?allowUnauthorized=false',
    object: {
      type: 's3',
      protocol: 'https',
      host: 's3-us-west-2.amazonaws.com',
      path: '/test-bucket/dir',
      username: 'a@b/c+d:e=:// ',
      password: 'e@d/c+b:a=s:// ',
      region: undefined,
      allowUnauthorized: false,
    },
  },
  {
    name: 'AZURE',
    url: 'azure://username:%2FpAssWord%3D%3D@username.blob.core.windows.net/xodev/newfolder/from/bob',
    object: {
      type: 'azure',
      host: 'username.blob.core.windows.net',
      protocol: 'https',
      port: '',
      path: '/xodev/newfolder/from/bob',
      username: 'username',
      password: '/pAssWord==',
    },
  },
  {
    name: 'azurite https',
    url: 'azurite://devstoreaccount1:Eby8vdM02xNOcqFlqUwJPLlmEtlCDXJ1OUzFT50uSRZ6IFsuFq2UVErCz4I6tq%2FK1SZFPTOtr%2FKBHBeksoGMGw%3D%3D@127.0.0.1:10000/xodevtest/folder/subfolder',
    object: {
      type: 'azurite',
      host: '127.0.0.1:10000',
      port: '10000',
      protocol: 'https',
      path: '/xodevtest/folder/subfolder',
      username: 'devstoreaccount1',
      password: 'Eby8vdM02xNOcqFlqUwJPLlmEtlCDXJ1OUzFT50uSRZ6IFsuFq2UVErCz4I6tq/K1SZFPTOtr/KBHBeksoGMGw==',
    },
  },
  {
    name: 'azurite http',
    url: 'azurite+http://devstoreaccount1:Eby8vdM02xNOcqFlqUwJPLlmEtlCDXJ1OUzFT50uSRZ6IFsuFq2UVErCz4I6tq%2FK1SZFPTOtr%2FKBHBeksoGMGw%3D%3D@127.0.0.1:10000/xodevtest/folder/subfolder',
    object: {
      type: 'azurite',
      host: '127.0.0.1:10000',
      port: '10000',
      protocol: 'http',
      path: '/xodevtest/folder/subfolder',
      username: 'devstoreaccount1',
      password: 'Eby8vdM02xNOcqFlqUwJPLlmEtlCDXJ1OUzFT50uSRZ6IFsuFq2UVErCz4I6tq/K1SZFPTOtr/KBHBeksoGMGw==',
    },
  },
]

// URLs accepted on parsing but never produced by format (legacy or malformed input)
const parseCases: ParseCase[] = [
  ...sharedCases,
  {
    name: 'file with missing leading slash (#7)',
    url: 'file://var/lib/xoa/backup',
    object: { type: 'file', path: '/var/lib/xoa/backup' },
  },
  {
    name: 'nfs with missing leading slash',
    url: 'nfs://192.168.100.225:media/nfs',
    object: { type: 'nfs', host: '192.168.100.225', port: undefined, path: '/media/nfs' },
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
    assert.throws(() => parse('smb://not-a-valid-smb-url'), /Invalid SMB url/)
  })

  it('keeps a non-JSON option value as a string', () => {
    assert.deepEqual(parse('file:///var/lib/xoa/backup?encryptionKey=notjson'), {
      type: 'file',
      path: '/var/lib/xoa/backup',
      encryptionKey: 'notjson',
    })
  })
})
