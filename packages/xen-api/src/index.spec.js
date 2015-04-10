/* eslint-env mocha */

import {createClient, Xapi} from './'

import expect from 'must'

// ===================================================================

describe('createClient()', function () {
  it('is a function', function () {
    expect(createClient).to.be.a.function()
  })

  it.skip('returns an instance of Xapi', function () {
    expect(createClient('example.org')).to.be.a(Xapi)
  })
})
