/* eslint-env mocha */

import expect from 'must'

// ===================================================================

import { parse, format } from './'

// ===================================================================

const data = {
  file: {
    url: 'file://var/lib/xoa/backup',
    type: 'local',
    path: '/var/lib/xoa/backup'
  },
  smb: {
    url: 'smb://Administrator:password@toto\\\\192.168.100.225\\smb\0',
    type: 'smb',
    host: '192.168.100.225\\smb',
    path: undefined,
    domain: 'toto',
    username: 'Administrator',
    password: 'password'
  }
}

// -------------------------------------------------------------------

describe('format', () => {
  for (const name in data) {
    const datum = data[name]
    it(name, () => {
      expect(format(datum)).to.equal(datum.url)
    })
  }
})

describe('parse', () => {
  for (const name in data) {
    const datum = data[name]
    it(name, () => {
      expect(parse(datum)).to.eql(datum)
    })
  }
})
