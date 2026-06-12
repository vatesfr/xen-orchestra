import type { RouteDefinition } from '@xen-orchestra/rest-api'
import type { XoHost } from '@vates/types'
import type { IpmiSensorsPlugin } from './index.mjs'

export function createIpmiRestRoutes(plugin: IpmiSensorsPlugin): RouteDefinition[] {
  return [
    {
      method: 'get',
      endpoint: 'hosts/{id}/ipmi-sensors',
      description: 'List the raw IPMI sensor inventory of a host. Required acl : ipmi:sensorsList on the host',
      tags: ['ipmi'],
      params: { id: { type: 'string' } },
      middlewares: [{ name: 'acl', acls: { resource: 'host', action: 'ipmi:sensorsList', objectId: 'params.id' } }],
      responses: [{ status: 200, description: 'Raw IPMI sensor inventory with product context' }],
      callback: async ({ req }) => {
        const host = plugin.xo.getObject<XoHost>(req.params.id as XoHost['id'], 'host')
        return plugin.getAvailableIpmiSensors({ host })
      },
    },
  ]
}
