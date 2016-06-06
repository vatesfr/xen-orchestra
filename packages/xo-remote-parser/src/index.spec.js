/* eslint-env mocha */

import expect from 'must'

// ===================================================================

import { parse, format } from './'

// ===================================================================

const FILE_FIXED = {
  url: 'file:///var/lib/xoa/backup',
  type: 'local',
  path: '/var/lib/xoa/backup'
}

const SMB = {
  url: 'smb://Administrator:password@toto\\\\192.168.100.225\\smb\0',
  type: 'smb',
  host: '192.168.100.225\\smb',
  path: undefined,
  domain: 'toto',
  username: 'Administrator',
  password: 'password'
}

const SMB_AROBAS = {
  url: 'smb://Administrator:pass@word@toto\\\\192.168.100.225\\smb\0',
  type: 'smb',
  host: '192.168.100.225\\smb',
  path: undefined,
  domain: 'toto',
  username: 'Administrator',
  password: 'pass@word'
}

const SMB_COLON = {
  url: 'smb://Administrator:pass:word@toto\\\\192.168.100.225\\smb\0',
  type: 'smb',
  host: '192.168.100.225\\smb',
  path: undefined,
  domain: 'toto',
  username: 'Administrator',
  password: 'pass:word'
}

const parseData = {
  file: {
    url: 'file://var/lib/xoa/backup', // Remotes formatted before fixing #7 will not break when reparses
    type: 'local',
    path: '/var/lib/xoa/backup'
  },
  fileFixed: FILE_FIXED,
  smb: SMB,
  'smb@inPassword': SMB_AROBAS,
  'smb:inPassword': SMB_COLON
}

const formatData = {
  file: {
    url: 'file:///var/lib/xoa/backup',
    type: 'local',
    path: '/var/lib/xoa/backup'
  },
  fileFixed: FILE_FIXED,
  smb: SMB,
  'smb@inPassword': SMB_AROBAS,
  'smb:inPassword': SMB_COLON
}

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
