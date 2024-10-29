import assert from 'node:assert'
import test from 'node:test'

import normalizeVmNetworks from './_normalizeVmNetworks.mjs'

test('normalizeVmNetworks', async t => {
  assert.deepStrictEqual(
    normalizeVmNetworks({
      // legacy protocol
      '0/ip': '127.0.0.1 127.0.0.2',

      // duplicates are removed
      '0/ipv4/0': '127.0.0.1',

      // addresses are not de-duplicated amongst devices
      '1/ip': '127.0.0.1',

      // addresses will be sorted by the alphabetical order of their key
      '0/ipv4/2': '127.0.0.4',
      '0/ipv4/1': '127.0.0.5',

      // any key are allowed
      '0/ipv4/foo bar': '127.0.0.3 127.0.0.6',

      // ipv6 protocol is supported as well
      '0/ipv6/0': '::1 ::2',

      // empty addresses are ignored
      '0/ipv4/3': '   ',

      // invalid keys are ignored
      '2/ipv5/0': '127.0.0.1',
    }),
    {
      '0/ipv4/0': '127.0.0.1',
      '0/ipv4/1': '127.0.0.2',
      '0/ipv4/2': '127.0.0.5',
      '0/ipv4/3': '127.0.0.4',
      '0/ipv4/4': '127.0.0.3',
      '0/ipv4/5': '127.0.0.6',
      '0/ipv6/0': '::1',
      '0/ipv6/1': '::2',
      '1/ipv4/0': '127.0.0.1',
    }
  )
})
