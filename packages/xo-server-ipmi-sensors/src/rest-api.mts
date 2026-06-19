import type { PluginRestRouteDefinition, XoHost } from '@vates/types'
import type { IpmiSensorsPlugin } from './index.mjs'
import { IPMI_SENSOR_DATA_TYPE } from './types.mjs'

export function createIpmiRestRoutes(plugin: IpmiSensorsPlugin): PluginRestRouteDefinition[] {
  return [
    {
      method: 'get',
      endpoint: 'hosts/{id}/ipmi',
      description: [
        'Get the IPMI inventory of a host: product context and the raw sensor list.',
        '',
        'Required privilege:',
        '- resource: host, action: read',
      ].join('\n'),
      tags: ['ipmi'],
      params: { id: { type: 'string', example: '5b2c9e6a-1d3f-4c7b-9f2e-8a1b0c4d5e6f' } },
      middlewares: [{ name: 'acl', acls: { resource: 'host', action: 'read', objectId: 'params.id' } }],
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
        {
          status: 404,
          description: 'Host not found',
        },
        {
          status: 503,
          description: 'The host has no available IPMI device',
        },
      ],
      callback: async ({ req, res }) => {
        const host = plugin.xo.getObject<XoHost>(req.params.id as XoHost['id'], 'host')
        const result = await plugin.getAvailableIpmiSensors({ host })
        if (!result.ipmiDeviceAvailable) {
          res.status(503).json(result)
          return
        }
        return result
      },
    },
  ]
}
