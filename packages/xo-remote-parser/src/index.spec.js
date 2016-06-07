/* eslint-env mocha */

import expect from 'must'

// ===================================================================

import { parse, format } from './'

// ===================================================================

// Data used for both parse and format (i.e. correctly formatted).
const data = {
  file: {
    in: {
      url: 'file:///var/lib/xoa/backup',
      name: 'fileRemote'
    },
    out: {
      url: 'file:///var/lib/xoa/backup',
      type: 'local',
      path: '/var/lib/xoa/backup',
      name: 'fileRemote'
    },
    url: 'file:///var/lib/xoa/backup'
  },
  SMB: {
    in: {
      url: 'smb://Administrator:pas:sw@ord@toto\\\\192.168.100.225\\smb\0',
      name: 'smbRemote'
    },
    out: {
      url: 'smb://Administrator:pas:sw@ord@toto\\\\192.168.100.225\\smb\0',
      type: 'smb',
      host: '192.168.100.225\\smb',
      path: '',
      domain: 'toto',
      username: 'Administrator',
      password: 'pas:sw@ord',
      name: 'smbRemote'
    },
    url: 'smb://Administrator:pas:sw@ord@toto\\\\192.168.100.225\\smb\0'
  }
}

const parseData = {
  ...data,

  'file with missing leading slash (#7)': {
    in: {
      url: 'file://var/lib/xoa/backup',
      name: 'fileRemote'
    },
    out: {
      url: 'file://var/lib/xoa/backup',
      type: 'local',
      path: '/var/lib/xoa/backup',
      name: 'fileRemote'
    },
    url: 'file:///var/lib/xoa/backup'
  }
}

const formatData = data

// -------------------------------------------------------------------

describe('format', () => {
  for (const name in formatData) {
    const datum = formatData[name]
    it(name, () => {
      expect(format({...datum.out})).to.equal(datum.url)
    })
  }
})

describe('parse', () => {
  for (const name in parseData) {
    const datum = parseData[name]
    it(name, () => {
      expect(parse({...datum.in})).to.eql(datum.out)
    })
  }
})
