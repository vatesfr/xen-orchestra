/* eslint-env mocha */

// Doc: https://github.com/moll/js-must/blob/master/doc/API.md#must

// import {getConnection} from './util'

// ===================================================================

describe('host', function () {
  /*let xo
  before(async function () {
    xo = await getConnection()
  })*/

// ===================================================================
  describe('.set()', function () {
    it('changes properties of the host')
  })

  // ------------------------------------------------------------------

  describe('.restart()', function () {
    it('restart the host')
  })

  // ------------------------------------------------------------------

  describe('.restartAgent()', function () {
    it('restart a Xen agent on the host')
  })

  // ------------------------------------------------------------------

  describe('.start()', function () {
    it('start the host')
  })

  // ------------------------------------------------------------------

  describe('.stop()', function () {
    it('stop the host')
  })

  // ------------------------------------------------------------------

  describe('.detach()', function () {
    it('ejects the host of a pool')
  })

  // ------------------------------------------------------------------

  describe('.enable()', function () {
    it('enables to create VM on the host')
  })

  // ------------------------------------------------------------------

  describe('.disable()', function () {
    it('disable to create VM on the host')
  })

  // ------------------------------------------------------------------

  describe('.listMissingPatches()', function () {
    it('returns an array of missing patches in the host')
    it('returns a empty arry if up-to-date')
  })

  // ------------------------------------------------------------------

  describe('.installPatch()', function () {
    it('installs a patch patch on the host')
  })

  // ------------------------------------------------------------------

  describe('.stats()', function () {
    it('returns an array with statistics of the host')
  })

})
