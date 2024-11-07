'use strict'

const { describe, it } = require('node:test')
const { strict: assert } = require('assert')

const deepFreeze = require('deep-freeze')

const { parse, format } = require('./')

// ===================================================================

// Data used for both parse and format (i.e. correctly formatted).
const data = deepFreeze({
  file: {
    string: 'file:///var/lib/xoa/backup',
    object: {
      type: 'file',
      path: '/var/lib/xoa/backup',
    },
  },
  'file with use vhd directory': {
    string: 'file:///var/lib/xoa/backup?useVhdDirectory=true',
    object: {
      type: 'file',
      path: '/var/lib/xoa/backup',
      useVhdDirectory: true,
    },
  },
  SMB: {
    string: 'smb://Administrator:pas:sw@ord@toto\\\\192.168.100.225\\smb\0',
    object: {
      type: 'smb',
      host: '192.168.100.225\\smb',
      path: '',
      domain: 'toto',
      username: 'Administrator',
      password: 'pas:sw@ord',
    },
  },
  'smb with directory': {
    string: 'smb://Administrator:pas:sw@ord@toto\\\\192.168.100.225\\smb\0?useVhdDirectory=true',
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
  NFS: {
    string: 'nfs://192.168.100.225:/media/nfs',
    object: {
      type: 'nfs',
      host: '192.168.100.225',
      port: undefined,
      path: '/media/nfs',
    },
  },
  'nfs with port': {
    string: 'nfs://192.168.100.225:20:/media/nfs',
    object: {
      type: 'nfs',
      host: '192.168.100.225',
      port: '20',
      path: '/media/nfs',
    },
  },
  'nfs with vhdDirectory': {
    string: 'nfs://192.168.100.225:20:/media/nfs?useVhdDirectory=true',
    object: {
      type: 'nfs',
      host: '192.168.100.225',
      port: '20',
      path: '/media/nfs',
      useVhdDirectory: true,
    },
  },
  S3: {
    string: 's3://AKIAS:XSuBupZ0mJlu%2B@s3-us-west-2.amazonaws.com/test-bucket/dir?allowUnauthorized=false',
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
  's3 accepting self signed ': {
    string: 's3://AKIAS:XSuBupZ0mJlu%2B@s3-us-west-2.amazonaws.com/test-bucket/dir?allowUnauthorized=true',
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
  'S3 with brotli': {
    string:
      's3+http://Administrator:password@192.168.100.225/bucket/dir?compressionType=%22brotli%22&compressionOptions=%7B%22level%22%3A1%7D#reg1',
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
  'S3 with 2 points': {
    string:
      's3://a%40b%2Fc%2Bd%3Ae%3D%3A%2F%2F%20:e%40d%2Fc%2Bb%3Aa%3Ds%3A%2F%2F%20@s3-us-west-2.amazonaws.com/test-bucket/dir?allowUnauthorized=false',
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
})

const parseData = deepFreeze({
  ...data,

  'file with missing leading slash (#7)': {
    string: 'file://var/lib/xoa/backup',
    object: {
      type: 'file',
      path: '/var/lib/xoa/backup',
    },
  },
  'nfs with missing leading slash': {
    string: 'nfs://192.168.100.225:media/nfs',
    object: {
      type: 'nfs',
      host: '192.168.100.225',
      port: undefined,
      path: '/media/nfs',
    },
  },
  'SMB with missing path': {
    string: 'smb://Administrator:pas:sw@ord@toto\\\\192.168.100.225\\smb',
    object: {
      type: 'smb',
      host: '192.168.100.225\\smb',
      path: '',
      domain: 'toto',
      username: 'Administrator',
      password: 'pas:sw@ord',
    },
  },
  'S3 with http and region': {
    string: 's3+http://Administrator:password@192.168.100.225/bucket/dir#reg1',
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
  'S3 accepting self signed certificate': {
    string: 's3+http://Administrator:password@192.168.100.225/bucket/dir?allowUnauthorized=true#reg1',
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
  's3 with empty region ': {
    string: 's3://AKIAS:XSuBupZ0mJlu%2B@s3-us-west-2.amazonaws.com/test-bucket/dir#',
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
})

const formatData = deepFreeze({
  ...data,

  'file with local type': {
    string: 'file:///var/lib/xoa/backup',
    object: {
      type: 'local',
      path: '/var/lib/xoa/backup',
    },
  },
})

// -------------------------------------------------------------------

describe('format', () => {
  for (const name in formatData) {
    const datum = formatData[name]
    it(name, () => {
      assert.equal(format(datum.object), datum.string)
    })
  }
})

describe('parse', () => {
  for (const name in parseData) {
    const datum = parseData[name]
    it(name, () => {
      assert.deepEqual(parse(datum.string), datum.object)
    })
  }
})
