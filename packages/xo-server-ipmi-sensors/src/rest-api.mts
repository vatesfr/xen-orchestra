import type { XoHost, PluginRestRouteDefinition } from '@vates/types'
import type { IpmiSensorsPlugin } from './index.mjs'
import { IPMI_SENSOR_DATA_TYPE } from './types.mjs'

export function createIpmiRestRoutes(plugin: IpmiSensorsPlugin): PluginRestRouteDefinition[] {
  return [
    {
      method: 'get',
      endpoint: 'hosts/{id}/ipmi-sensors',
      description: 'List the raw IPMI sensor inventory of a host. Required acl : ipmi:sensorsList on the host',
      tags: ['ipmi'],
      params: { id: { type: 'string' } },
      middlewares: [{ name: 'acl', acls: { resource: 'host', action: 'ipmi:sensorsList', objectId: 'params.id' } }],
      responses: [
        {
          status: 200,
          description: 'Raw IPMI sensor inventory with product context',
          schema: {
            productName: { type: 'string', example: 'poweredge r640' },
            systemManufacturer: { type: 'string', example: 'dell inc.' },
            ipmiDeviceAvailable: { type: 'boolean', example: true },
            sensors: {
              type: 'array',
              example: [
                { name: 'Inlet Temp', value: '23', event: 'ok', dataType: 'inletTemp' },
                { name: 'Fan1', value: '4800', event: 'ok', dataType: 'fanSpeed' },
                { name: 'Pwr Consumption', value: '140', event: 'ok', dataType: 'totalPower' },
              ],
              items: {
                type: 'object',
                fields: {
                  name: { type: 'string', example: 'Inlet Temp' },
                  value: { type: 'string', example: '23' },
                  event: { type: 'string', example: 'ok' },
                  dataType: { type: 'enum', enum: Object.keys(IPMI_SENSOR_DATA_TYPE), example: 'inletTemp' },
                },
              },
            },
          },
        },
      ],
      callback: async ({ req }) => {
        const host = plugin.xo.getObject<XoHost>(req.params.id as XoHost['id'], 'host')
        return plugin.getAvailableIpmiSensors({ host })
      },
    },
  ]
}
