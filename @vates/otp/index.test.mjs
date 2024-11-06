import { strict as assert } from 'node:assert'
import test from 'node:test'

import {
  generateHotp,
  generateHotpUri,
  generateSecret,
  generateTotp,
  generateTotpUri,
  verifyHotp,
  verifyTotp,
} from './index.mjs'

const { describe, it } = test

describe('generateSecret', function () {
  it('generates a string of 32 chars', async function () {
    const secret = generateSecret()
    assert.equal(typeof secret, 'string')
    assert.equal(secret.length, 32)
  })

  it('generates a different secret at each call', async function () {
    assert.notEqual(generateSecret(), generateSecret())
  })
})

describe('HOTP', function () {
  it('generate and verify valid tokens', async function () {
    for (const [token, opts] of Object.entries({
      382752: {
        counter: -3088,
        secret: 'PJYFSZ3JNVXVQMZXOB2EQYJSKB2HE6TB',
      },
      163376: {
        counter: 30598,
        secret: 'GBUDQZ3UKZZGIMRLNVYXA33GMFMEGQKN',
      },
    })) {
      assert.equal(await generateHotp(opts), token)
      assert(await verifyHotp(token, opts))
    }
  })

  describe('generateHotpUri', function () {
    const opts = {
      counter: 59732,
      label: 'the label',
      secret: 'OGK45BBZAIGNGELHZPXYKN4GUVWWO6YX',
    }

    Object.entries({
      'without optional params': [
        opts,
        'otpauth://hotp/the%20label?counter=59732&secret=OGK45BBZAIGNGELHZPXYKN4GUVWWO6YX',
      ],
      'with issuer': [
        { ...opts, issuer: 'the issuer' },
        'otpauth://hotp/the%20issuer:the%20label?counter=59732&issuer=the%20issuer&secret=OGK45BBZAIGNGELHZPXYKN4GUVWWO6YX',
      ],
      'with digits': [
        { ...opts, digits: 7 },
        'otpauth://hotp/the%20label?counter=59732&digits=7&secret=OGK45BBZAIGNGELHZPXYKN4GUVWWO6YX',
      ],
    }).forEach(([title, [opts, uri]]) => {
      it(title, async function () {
        assert.strictEqual(generateHotpUri(opts), uri)
      })
    })
  })
})

describe('TOTP', function () {
  Object.entries({
    '033702': {
      secret: 'PJYFSZ3JNVXVQMZXOB2EQYJSKB2HE6TB',
      timestamp: 1665416296,
      period: 30,
    },
    107250: {
      secret: 'GBUDQZ3UKZZGIMRLNVYXA33GMFMEGQKN',
      timestamp: 1665416674,
      period: 60,
    },
  }).forEach(([token, opts]) => {
    it('works', async function () {
      assert.equal(await generateTotp(opts), token)
      assert(await verifyTotp(token, opts))
    })
  })

  describe('generateHotpUri', function () {
    const opts = {
      label: 'the label',
      secret: 'OGK45BBZAIGNGELHZPXYKN4GUVWWO6YX',
    }

    Object.entries({
      'without optional params': [opts, 'otpauth://totp/the%20label?secret=OGK45BBZAIGNGELHZPXYKN4GUVWWO6YX'],
      'with issuer': [
        { ...opts, issuer: 'the issuer' },
        'otpauth://totp/the%20issuer:the%20label?issuer=the%20issuer&secret=OGK45BBZAIGNGELHZPXYKN4GUVWWO6YX',
      ],
      'with digits': [
        { ...opts, digits: 7 },
        'otpauth://totp/the%20label?digits=7&secret=OGK45BBZAIGNGELHZPXYKN4GUVWWO6YX',
      ],
    }).forEach(([title, [opts, uri]]) => {
      it(title, async function () {
        assert.strictEqual(generateTotpUri(opts), uri)
      })
    })
  })
})
