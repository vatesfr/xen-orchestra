import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import type { XoHost, XoPif } from '@vates/types'
import { HOST_POWER_STATE, IP_CONFIGURATION_MODE } from '@vates/types'
import type { RestApi } from '../rest-api/rest-api.mjs'

import { HostService } from './host.service.mjs'

const HOST_ID = 'b61a5c92-700e-4966-a13b-00633f03eea8' as XoHost['id']
const TARGET_PIF_ID = 'd9e42451-3794-089f-de81-4ee0e6137bee' as XoPif['id']
const MANAGEMENT_PIF_ID = '355ee47d-ff4c-4924-3db2-fd86ae629676' as XoPif['id']

const objects = {
  [HOST_ID]: {
    id: HOST_ID,
    power_state: HOST_POWER_STATE.RUNNING,
    $PIFs: [TARGET_PIF_ID, MANAGEMENT_PIF_ID],
  },
  [TARGET_PIF_ID]: {
    id: TARGET_PIF_ID,
    $host: HOST_ID,
    attached: true,
    management: false,
    mode: IP_CONFIGURATION_MODE.NONE,
    _xapiRef: 'OpaqueRef:target-pif',
  },
  [MANAGEMENT_PIF_ID]: {
    id: MANAGEMENT_PIF_ID,
    management: true,
    mode: IP_CONFIGURATION_MODE.STATIC,
    ip: '192.168.1.1',
    netmask: '255.255.255.0',
    gateway: '192.168.1.254',
    dns: '192.168.1.1',
    _xapiRef: 'OpaqueRef:management-pif',
  },
}

const RECONFIGURE_ERROR = new Error('management_reconfigure failed')
const ROLLBACK_ERROR = new Error('management_reconfigure rollback failed')

function createRestApi({ failRollback = false } = {}) {
  const calls: unknown[][] = []

  const xapi = {
    async callAsync(...args: unknown[]) {
      calls.push(args)
      if (args[0] === 'host.management_reconfigure') {
        throw RECONFIGURE_ERROR
      }
      if (failRollback && args[0] === 'PIF.reconfigure_ip' && args[2] === 'None') {
        throw ROLLBACK_ERROR
      }
    },
  }

  const restApi = {
    getObject: id => objects[id],
    getXapiObject: () => ({ $xapi: xapi }),
  } as unknown as RestApi

  return { calls, restApi }
}

describe('HostService.moveManagementIp', () => {
  it('should remove the copied IP from the target PIF and rethrow the original error', async () => {
    const { calls, restApi } = createRestApi()
    const hostService = new HostService(restApi)
    await assert.rejects(hostService.moveManagementIp(HOST_ID, TARGET_PIF_ID), RECONFIGURE_ERROR)
    assert.deepEqual(calls, [
      [
        'PIF.reconfigure_ip',
        'OpaqueRef:target-pif',
        'Static',
        '192.168.1.1',
        '255.255.255.0',
        '192.168.1.254',
        '192.168.1.1',
      ],
      ['host.management_reconfigure', 'OpaqueRef:target-pif'],
      ['PIF.reconfigure_ip', 'OpaqueRef:target-pif', 'None', '', '', '', ''],
    ])
  })
  it('should still rethrow the original error when the rollback fails too', async () => {
    const { calls, restApi } = createRestApi({ failRollback: true })
    const hostService = new HostService(restApi)

    await assert.rejects(hostService.moveManagementIp(HOST_ID, TARGET_PIF_ID), RECONFIGURE_ERROR)
    assert.deepEqual(calls, [
      [
        'PIF.reconfigure_ip',
        'OpaqueRef:target-pif',
        'Static',
        '192.168.1.1',
        '255.255.255.0',
        '192.168.1.254',
        '192.168.1.1',
      ],
      ['host.management_reconfigure', 'OpaqueRef:target-pif'],
      ['PIF.reconfigure_ip', 'OpaqueRef:target-pif', 'None', '', '', '', ''],
    ])
  })
})
