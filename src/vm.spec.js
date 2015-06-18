/* eslint-env mocha */

// Doc: https://github.com/moll/js-must/blob/master/doc/API.md#must
// import expect from 'must'

// ===================================================================

import {getConnection} from './util'

// ===================================================================

describe('vm', function () {
  let xo
  before(async function () {
    xo = await getConnection()
  })

  // =================================================================

  describe('.create()', function () {
    describe('.createHVM()', function () {
      it('creates a VM with the Other Config template, three disks, two interfaces and a ISO mounted, and return its UUID')
      it('creates a VM with the Other Config template, no disk, no network and a ISO mounted, and return its UUID')
    })
    describe('.createPV()', function () {
      it('creates a VM with the Debian 7 64 bits template, network install, one disk, one network, and return its UUID')
      it('creates a VM with the CentOS 7 64 bits template, two disks, two networks and a ISO mounted and return its UUID')
    })
  })

  // ------------------------------------------------------------------

  describe('.delete()', function () {
    it('deletes a VM')
    it('')
  })

  // ------------------------------------------------------------------

  describe('.ejectCd()', function () {
    it('')
  })

  // -------------------------------------------------------------------

  describe('.insertCd()', function () {
    it('')
  })

  // -------------------------------------------------------------------

  describe('.migrate', function () {
    it('migrates the VM on an other host')
  })

  // -------------------------------------------------------------------

  describe('.migratePool()', function () {
    it('migrates the VM on an other host which is in an other pool')
  })

  // -------------------------------------------------------------------

  describe('.set()', function () {
    it('sets a VM name and returns true')
    it('sets a VM description and returns true')
    it('sets a VM vCPUS number and returns true')
    it('sets a VM RAM amount and returns true')
  })

  // --------------------------------------------------------------------

  describe('.cycle()', function () {
    it('starts a VM and returns true')
    it('stops a VM and returns true')
    it('restarts a VM and returns true')
    it('suspends a VM and returns true')
    it('resumes a VM and returns true')
    it('clones a VM and returns true')
    it('converts a VM and returns true')
  })

  // ---------------------------------------------------------------------

  describe('.snapshot()', function () {
    it('snapshots a VM and returns its snapshot UUID')
    it('reverts a VM snapshot and returns true')
  })

  // ---------------------------------------------------------------------

  describe('.revert()', function () {
    it('')
  })

  // ---------------------------------------------------------------------

  describe('.handleExport()', function () {
    it('')
  })

  // --------------------------------------------------------------------

  describe('.import()', function () {
    it('')
  })

  // ---------------------------------------------------------------------

  describe('.attachDisk()', function () {
    it('')
  })

  // ---------------------------------------------------------------------

  describe('.createInterface()', function () {
    it('')
  })

  // ---------------------------------------------------------------------

  describe('.attachPci()', function () {
    it('')
  })

  // ---------------------------------------------------------------------

  describe('.detachPci()', function () {
    it('')
  })

  // ---------------------------------------------------------------------

  describe('.stats()', function () {
    it('returns an array with statistics of the VM')
  })

  // ---------------------------------------------------------------------
  describe('.bootOrder()', function () {
    it('')
  })
})
