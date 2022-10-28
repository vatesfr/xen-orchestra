import { base32 } from 'rfc4648'
import { webcrypto } from 'node:crypto'

const { subtle } = webcrypto

function assert(name, value) {
  if (!value) {
    throw new TypeError('invalid value for param ' + name)
  }
}

// https://github.com/google/google-authenticator/wiki/Key-Uri-Format
function generateUri(protocol, label, params) {
  assert('label', typeof label === 'string')
  assert('secret', typeof params.secret === 'string')

  let path = encodeURIComponent(label)

  const { issuer } = params
  if (issuer !== undefined) {
    path = encodeURIComponent(issuer) + ':' + path
  }

  const query = Object.entries(params)
    .filter(_ => _[1] !== undefined)
    .map(([key, value]) => key + '=' + encodeURIComponent(value))
    .join('&')

  return `otpauth://${protocol}/${path}?${query}`
}

export function generateSecret() {
  // https://www.rfc-editor.org/rfc/rfc4226 recommends 160 bits (i.e. 20 bytes)
  const data = new Uint8Array(20)
  webcrypto.getRandomValues(data)
  return base32.stringify(data, { pad: false })
}

const DIGITS = 6

// https://www.rfc-editor.org/rfc/rfc4226
export async function generateHotp({ counter, digits = DIGITS, secret }) {
  const data = new Uint8Array(8)
  new DataView(data.buffer).setBigInt64(0, BigInt(counter), false)

  const key = await subtle.importKey(
    'raw',
    base32.parse(secret, { loose: true }),
    { name: 'HMAC', hash: 'SHA-1' },
    false,
    ['sign', 'verify']
  )
  const digest = new DataView(await subtle.sign('HMAC', key, data))

  const offset = digest.getUint8(digest.byteLength - 1) & 0xf
  const p = digest.getUint32(offset) & 0x7f_ff_ff_ff

  return String(p % Math.pow(10, digits)).padStart(digits, '0')
}

export function generateHotpUri({ counter, digits, issuer, label, secret }) {
  assert('counter', typeof counter === 'number')
  return generateUri('hotp', label, { counter, digits, issuer, secret })
}

export async function verifyHotp(token, opts) {
  return token === (await generateHotp(opts))
}

function totpCounter(period = 30, timestamp = Math.floor(Date.now() / 1e3)) {
  return Math.floor(timestamp / period)
}

// https://www.rfc-editor.org/rfc/rfc6238.html
export async function generateTotp({ period, timestamp, ...opts }) {
  opts.counter = totpCounter(period, timestamp)
  return await generateHotp(opts)
}

export function generateTotpUri({ digits, issuer, label, period, secret }) {
  return generateUri('totp', label, { digits, issuer, period, secret })
}

export async function verifyTotp(token, { period, timestamp, window = 1, ...opts }) {
  const counter = totpCounter(period, timestamp)
  const end = counter + window
  opts.counter = counter - window
  while (opts.counter <= end) {
    if (token === (await generateHotp(opts))) {
      return true
    }
    opts.counter += 1
  }
  return false
}

export async function verifyFromUri(token, uri) {
  const url = new URL(uri)
  assert('protocol', url.protocol === 'otpauth:')

  const { host } = url
  const opts = Object.fromEntries(url.searchParams.entries())
  if (host === 'hotp') {
    return await verifyHotp(token, opts)
  }
  if (host === 'totp') {
    return await verifyTotp(token, opts)
  }

  assert('host', false)
}
