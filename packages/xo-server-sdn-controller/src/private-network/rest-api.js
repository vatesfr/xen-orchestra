// @ts-check

import { QUERY_SYNC } from '../rest-api'

// TypeScript reads this Babel package as CommonJS, and @vates/types is ESM: hence the resolution-mode
/**
 * @import { PluginRestRouteDefinition } from '@vates/types' with { 'resolution-mode': 'import' }
 * @typedef {ReturnType<typeof import('../index.js').default>} SdnController
 */

// No ACL middleware: admins only, like the `sdnController.createPrivateNetwork` JSON-RPC method
/**
 * @param {SdnController} controller
 * @returns {PluginRestRouteDefinition}
 */
export function createPrivateNetworkRoute(controller) {
  return {
    endpoint: '/private_networks',
    description:
      'Create a Global Private Network: one network per pool, whose hosts are linked by GRE or VXLAN tunnels.\n\n`pifIds` holds one PIF of each pool, the tunnels go through its network. The networks are created one pool after the other: if a pool fails, the networks of the pools before it stay.\n\nAnswers the ids of the created networks with `sync=true`. Otherwise the response points to the task, whose result holds them.',
    method: 'post',
    tags: ['sdn-controller'],
    query: QUERY_SYNC,
    body: {
      poolIds: { type: 'array', items: { type: 'string' }, example: ['355ee47d-ff4c-4924-3db2-fd86ae629676'] },
      pifIds: { type: 'array', items: { type: 'string' }, example: ['ad15b2c8-3d9a-194e-c43a-e3dcda74b256'] },
      name: { type: 'string', example: 'private network' },
      description: { type: 'string', example: 'network of the build VMs' },
      encapsulation: { type: 'enum', enum: ['gre', 'vxlan'], example: 'gre' },
      encrypted: { type: 'boolean', example: false, optional: true },
      mtu: { type: 'number', example: 1450, optional: true },
      preferredCenterId: { type: 'string', example: 'b61a5c92-700e-4966-a13b-00633f03eea8', optional: true },
    },
    responses: [
      { status: 201, description: 'Private network created' },
      { status: 202, description: 'Action executed asynchronously' },
      { status: 404, description: 'No pool, PIF or host found for one of these IDs' },
      {
        status: 422,
        description: 'A pool without a PIF in `pifIds`, or a preferred center outside the pools',
      },
    ],
    middlewares: [{ name: 'json' }],
    callback: ({ req, createAction }) =>
      createAction(async () => ({ ids: await controller._createPrivateNetwork(req.body) }), {
        // coerceQueryParams has made `sync` a boolean, which the express Request type cannot know
        sync: /** @type {boolean | undefined} */ (req.query.sync) ?? false,
        statusCode: 201,
        // The route creates one network per pool, across several pools: there is no single
        // object to attach the task to, so objectId is left unset
        taskProperties: { name: 'create private network', params: req.body },
      }),
  }
}
