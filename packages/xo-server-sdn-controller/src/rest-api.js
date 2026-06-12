const MIDDLEWARES_JSON = [{ name: 'json' }]

const QUERY_SYNC = { sync: { type: 'boolean', optional: true } }

const BODY_ADD_RULE = {
  allow: { type: 'boolean' },
  direction: { type: 'string' },
  ipRange: { type: 'string' },
  protocol: { type: 'string' },
  port: { type: 'number', optional: true },
}

const BODY_DELETE_RULE = {
  direction: { type: 'string' },
  ipRange: { type: 'string' },
  protocol: { type: 'string' },
  port: { type: 'number', optional: true },
}

export function createRestRoutes(controller) {
  return [
    {
      endpoint: '/networks/{id}/actions/add_traffic_rule',
      method: 'post',
      middlewares: MIDDLEWARES_JSON,
      query: QUERY_SYNC,
      body: BODY_ADD_RULE,
      callback: ({ req, createAction }) => {
        const rule = {
          allow: req.body.allow,
          direction: req.body.direction,
          ipRange: req.body.ipRange,
          protocol: req.body.protocol,
          networkId: req.params.id,
        }
        if (req.body.port != null) {
          rule.port = req.body.port
        }
        return createAction(() => controller._addNetworkRule(rule), {
          sync: req.query.sync ?? false,
          statusCode: 204,
          taskProperties: {
            name: 'add network traffic rule',
            objectId: rule.networkId,
          },
        })
      },
    },
    {
      endpoint: '/networks/{id}/actions/delete_traffic_rule',
      method: 'post',
      middlewares: MIDDLEWARES_JSON,
      query: QUERY_SYNC,
      body: BODY_DELETE_RULE,
      callback: ({ req, createAction }) => {
        const rule = {
          direction: req.body.direction,
          ipRange: req.body.ipRange,
          protocol: req.body.protocol,
          networkId: req.params.id,
        }
        if (req.body.port != null) {
          rule.port = req.body.port
        }
        return createAction(() => controller._deleteNetworkOfRule(rule), {
          sync: req.query.sync ?? false,
          statusCode: 204,
          taskProperties: {
            name: 'delete network traffic rule',
            objectId: rule.networkId,
          },
        })
      },
    },
    {
      endpoint: '/vifs/{id}/actions/add_traffic_rule',
      method: 'post',
      middlewares: MIDDLEWARES_JSON,
      query: QUERY_SYNC,
      body: BODY_ADD_RULE,
      callback: ({ req, createAction }) => {
        const rule = {
          allow: req.body.allow,
          direction: req.body.direction,
          ipRange: req.body.ipRange,
          protocol: req.body.protocol,
          vifId: req.params.id,
        }
        if (req.body.port != null) {
          rule.port = req.body.port
        }
        return createAction(() => controller._addRule(rule), {
          sync: req.query.sync ?? false,
          statusCode: 204,
          taskProperties: {
            name: 'add vif traffic rule',
            objectId: rule.vifId,
          },
        })
      },
    },
    {
      endpoint: '/vifs/{id}/actions/delete_traffic_rule',
      method: 'post',
      middlewares: MIDDLEWARES_JSON,
      query: QUERY_SYNC,
      body: BODY_DELETE_RULE,
      callback: ({ req, createAction }) => {
        const rule = {
          direction: req.body.direction,
          ipRange: req.body.ipRange,
          protocol: req.body.protocol,
          vifId: req.params.id,
        }
        if (req.body.port != null) {
          rule.port = req.body.port
        }
        return createAction(() => controller._deleteRule(rule), {
          sync: req.query.sync ?? false,
          statusCode: 204,
          taskProperties: {
            name: 'delete vif traffic rule',
            objectId: rule.vifId,
          },
        })
      },
    },
  ]
}
