/* eslint-env mocha */

// Doc: https://github.com/moll/js-must/blob/master/doc/API.md#must
import expect from 'must'

// ===================================================================

import {find} from 'lodash'
import {Xo} from 'xo-lib'

// ===================================================================

describe('vm', function () {
  let xo
  before(async function () {
    xo = new Xo('localhost:9000')

    await xo.signIn({
      email: 'admin@admin.net',
      password: 'admin'
    })
  })

  // =================================================================

  describe('.set()', function () {
    it('sets a VM name and returns true')
    it('sets a VM description and returns true')
    it('sets a VM vCPUS number and returns true')
    it('sets a VM RAM amount and returns true')
  })

  // =================================================================

  describe('.cycle()', function () {
    it('starts a VM and returns true')
    it('stops a VM and returns true')
    it('restarts a VM and returns true')
    it('suspends a VM and returns true')
    it('resumes a VM and returns true')
    it('clones a VM and returns true')
    it('converts a VM and returns true')
  })

  // =================================================================

  describe('.snapshot()', function () {
    it('snapshots a VM and returns its snapshot UUID')
    it('reverts a VM snapshot and returns true')
  })

  // =================================================================

  describe('.createHVM()', function () {
    it('creates a VM with the Other Config template, three disks, two interfaces and a ISO mounted, and return its UUID')
    it('creates a VM with the Other Config template, no disk, no network and a ISO mounted, and return its UUID')
  })
  // =================================================================

  describe('.createPV()', function () {
    it('creates a VM with the Debian 7 64 bits template, network install, one disk, one network, and return its UUID')
    it('creates a VM with the CentOS 7 64 bits template, two disks, two networks and a ISO mounted and return its UUID')
  })
})
