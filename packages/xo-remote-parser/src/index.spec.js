/* eslint-env mocha */

import expect from 'must'

// ===================================================================

import { parse, format } from './'

// ===================================================================

// Data used for both parse and format (i.e. correctly formatted).
const data = {
  file: {
    url: 'file:///var/lib/xoa/backup',
    type: 'local',
    path: '/var/lib/xoa/backup'
  },
  SMB: {
    url: 'smb://Administrator:password@toto\\\\192.168.100.225\\smb\0',
    type: 'smb',
    host: '192.168.100.225\\smb',
    path: '',
    domain: 'toto',
    username: 'Administrator',
    password: 'password'
  },
  'SMB with @ sign in password': {
    url: 'smb://Administrator:pass@word@toto\\\\192.168.100.225\\smb\0',
    type: 'smb',
    host: '192.168.100.225\\smb',
    path: '',
    domain: 'toto',
    username: 'Administrator',
    password: 'pass@word'
  },
  'SMB with colon in password': {
    url: 'smb://Administrator:pass:word@toto\\\\192.168.100.225\\smb\0',
    type: 'smb',
    host: '192.168.100.225\\smb',
    path: '',
    domain: 'toto',
    username: 'Administrator',
    password: 'pass:word'
  }
}

const parseData = {
  ...data,

  'file with missing leading slash (#7)': {
    url: 'file://var/lib/xoa/backup',
    type: 'local',
    path: '/var/lib/xoa/backup'
  }
}

const formatData = data

// -------------------------------------------------------------------

describe('format', () => {
  for (const name in formatData) {
    const datum = formatData[name]
    it(name, () => {
      expect(format(datum)).to.equal(datum.url)
    })
  }
})

describe('parse', () => {
  for (const name in parseData) {
    const datum = parseData[name]
    it(name, () => {
      expect(parse(datum)).to.eql(datum)
    })
  }
})
