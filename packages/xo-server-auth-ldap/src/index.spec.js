/* eslint-env mocha */

import authLdap from './'

import expect from 'must'
import {assert, spy} from 'sinon'

import sourceMapSupport from 'source-map-support'
sourceMapSupport.install()

// ===================================================================

describe('authLdap()', function () {
  before(function () {
    this.instance = authLdap({})

    this.xo = {
      registerAuthenticationProvider: spy(),
      unregisterAuthenticationProvider: spy()
    }
  })

  it('is a function', function () {
    expect(authLdap).to.be.a.function()
  })

  it('returns an object', function () {
    expect(this.instance).to.be.an.object()
  })

  it('#load(xo) register the auth provider', function () {
    this.instance.load(this.xo)

    const spy = this.xo.registerAuthenticationProvider
    assert.calledOnce(spy)

    this.provider = spy.args[0][0]
    expect(this.provider).to.be.a.function()
  })

  it('#unload(xo) unregister the auth provider', function () {
    this.instance.unload(this.xo)

    const spy = this.xo.unregisterAuthenticationProvider
    assert.calledOnce(spy)

    expect(spy.args[0][0]).to.be(this.provider)
  })
})
