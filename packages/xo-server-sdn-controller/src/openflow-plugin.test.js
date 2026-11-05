import { describe, it } from 'node:test'
import { strict as assert } from 'node:assert'

import { OpenFlowPlugin } from './openflow-plugin.js'

// a XAPI error, as xen-api's XapiError: the message is `CODE(params)`
function xapiError(code, params) {
  const error = new Error(`${code}(${params.join(', ')})`)
  error.code = code
  error.params = params
  return error
}

function fakeHost(name, error) {
  const calls = []
  const host = {
    $ref: `ref-${name}`,
    name_label: name,
    $xapi: {
      async call(...args) {
        calls.push(args)
        if (error !== undefined) {
          throw error
        }
        return '{"returncode": 0}'
      },
    },
  }
  return { host, calls }
}

describe('OpenFlowPlugin', () => {
  const missingPlugin = xapiError('XENAPI_MISSING_PLUGIN', ['sdncontroller.py'])
  const host1 = fakeHost('host-1')
  const host2 = fakeHost('host-2', missingPlugin)
  const network = { bridge: 'xenbr0', $PIFs: [{ $host: host1.host }, { $host: host2.host }] }
  const vif = { MAC: '02:00:00:00:00:01', $network: network }
  const rule = { allow: false, protocol: 'TCP', ipRange: '192.0.2.10', direction: 'from/to', port: 22 }

  it('says which host failed a VIF rule, and why', async () => {
    await assert.rejects(new OpenFlowPlugin().addRule({ vif, ...rule }), error => {
      assert.equal(error.message, 'XENAPI_MISSING_PLUGIN(sdncontroller.py) on host-2')
      assert.equal(error.errors.length, 1)
      assert.equal(error.errors[0].cause, missingPlugin)
      // the XAPI error's details are serialized with it
      assert.deepEqual(JSON.parse(JSON.stringify(error.errors[0])).cause, {
        code: 'XENAPI_MISSING_PLUGIN',
        params: ['sdncontroller.py'],
      })
      return true
    })
    assert.equal(host1.calls.length, 1)
    assert.equal(host2.calls.length, 1)
  })

  it('says which host failed a network rule, and why', async () => {
    await assert.rejects(new OpenFlowPlugin().deleteNetworkRule({ network, ...rule, cookie: '0x1' }), {
      message: 'XENAPI_MISSING_PLUGIN(sdncontroller.py) on host-2',
    })
  })

  it('lists every host that failed', async () => {
    const other = fakeHost('host-3', new Error('connect ETIMEDOUT'))
    const network3 = { bridge: 'xenbr0', $PIFs: [...network.$PIFs, { $host: other.host }] }
    await assert.rejects(new OpenFlowPlugin().addRule({ vif: { ...vif, $network: network3 }, ...rule }), {
      message: 'XENAPI_MISSING_PLUGIN(sdncontroller.py) on host-2, connect ETIMEDOUT on host-3',
    })
  })

  it('succeeds when every host applies the rule', async () => {
    const ok = { bridge: 'xenbr0', $PIFs: [{ $host: fakeHost('host-1').host }] }
    await new OpenFlowPlugin().addRule({ vif: { ...vif, $network: ok }, ...rule })
  })
})
