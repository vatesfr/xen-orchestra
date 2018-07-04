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
      path: '/media/nfs',
    },
  },
})

const NFS_WITH_PORT_DATA = {
  'nfs with port': {
    string: 'nfs://192.168.100.225:20:/media/nfs',
    object: {
      type: 'nfs',
      host: '192.168.100.225',
      port: '20',
      path: '/media/nfs',
    },
  },
}

const parseData = deepFreeze({
  ...data,
  ...NFS_WITH_PORT_DATA,

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
})

const formatData = deepFreeze({
  ...data,
  ...NFS_WITH_PORT_DATA,

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
