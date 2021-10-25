/* eslint-env jest */

import deepFreeze from 'deep-freeze'

import { parse, format } from './'

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
  S3: {
    string: 's3://AKIAS:XSuBupZ0mJlu%2B@s3-us-west-2.amazonaws.com/test-bucket/dir?acceptSelfSigned=false',
    object: {
      type: 's3',
      protocol: 'https',
      host: 's3-us-west-2.amazonaws.com',
      path: '/test-bucket/dir',
      username: 'AKIAS',
      password: 'XSuBupZ0mJlu+',
      region: undefined,
      acceptSelfSigned: false,
    },
  },
  's3 accepting self signed ': {
    string: 's3://AKIAS:XSuBupZ0mJlu%2B@s3-us-west-2.amazonaws.com/test-bucket/dir?acceptSelfSigned=true',
    object: {
      type: 's3',
      protocol: 'https',
      host: 's3-us-west-2.amazonaws.com',
      path: '/test-bucket/dir',
      username: 'AKIAS',
      password: 'XSuBupZ0mJlu+',
      region: undefined,
      acceptSelfSigned: true,
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
      acceptSelfSigned: false,
    },
  },
  'S3 accepting self signed certificate': {
    string: 's3+http://Administrator:password@192.168.100.225/bucket/dir?acceptSelfSigned=true#reg1',
    object: {
      type: 's3',
      host: '192.168.100.225',
      protocol: 'http',
      path: '/bucket/dir',
      region: 'reg1',
      username: 'Administrator',
      password: 'password',
      acceptSelfSigned: true,
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
      expect(format(datum.object)).toBe(datum.string)
    })
  }
})

describe('parse', () => {
  for (const name in parseData) {
    const datum = parseData[name]
    it(name, () => {
      expect(parse(datum.string)).toEqual(datum.object)
    })
  }
})
