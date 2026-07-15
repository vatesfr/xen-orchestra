import { flatMap, mapValues, omit } from 'lodash'
import { noSuchObject } from 'xo-common/api-errors.js'
import { SDN_CONTROLLER_OF_RULES_KEY } from '@vates/types'

const QUERY_SYNC = { sync: { type: 'boolean', optional: true } }

const PARAMS_ID = { id: { type: 'string', example: 'b97f4e69-d275-4b25-9dc9-c1ac4e9b3fa5' } }

const RULE_FIELDS = {
  allow: { type: 'boolean', example: true },
  direction: { type: 'string', example: 'to' },
  ipRange: { type: 'string', example: '192.168.0.0/24' },
  protocol: { type: 'string', example: 'tcp' },
  port: { type: 'number', example: 443, optional: true },
}

const BODY_ADD_RULE = RULE_FIELDS

const BODY_DELETE_RULE = omit(RULE_FIELDS, 'allow')

const BODY_UPDATE_RULE = {
  oldRule: { type: 'object', fields: RULE_FIELDS },
  newRule: {
    type: 'object',
    fields: mapValues(RULE_FIELDS, field => ({ ...field, optional: true })),
  },
}

// network and vif traffic-rule routes only differ by these tokens
const RESOURCES = [
  {
    collection: 'networks',
    acl: 'network',
    type: 'network',
    idKey: 'networkId',
    addRule: (controller, rule) => controller._addNetworkRule(rule),
    deleteRule: (controller, rule) => controller._deleteNetworkOfRule(rule),
  },
  {
    collection: 'vifs',
    acl: 'vif',
    type: 'VIF',
    idKey: 'vifId',
    addRule: (controller, rule) => controller._addRule(rule),
    deleteRule: (controller, rule) => controller._deleteRule(rule),
  },
]

function jsonAndAcl(resource) {
  return [{ name: 'json' }, { name: 'acl', acls: { resource, action: 'update:other_config', objectId: 'params.id' } }]
}

function parseRules(raw) {
  return raw == null ? [] : JSON.parse(raw).map(JSON.parse)
}

function rulesEqual(a, b) {
  return (
    a.allow === b.allow &&
    a.direction === b.direction &&
    a.ipRange === b.ipRange &&
    a.port === b.port &&
    a.protocol.toLowerCase() === b.protocol.toLowerCase()
  )
}

function ruleFromBody(req, idKey, withAllow) {
  const rule = {
    direction: req.body.direction,
    ipRange: req.body.ipRange,
    protocol: req.body.protocol,
    [idKey]: req.params.id,
  }
  if (withAllow) {
    rule.allow = req.body.allow
  }
  if (req.body.port != null) {
    rule.port = req.body.port
  }
  return rule
}

function addRuleRoute(controller, resource) {
  return {
    endpoint: `/${resource.collection}/{id}/actions/add_traffic_rule`,
    description: `Add a traffic rule to a ${resource.type}.\n\nRequired privilege:\n - resource: ${resource.acl}, action: update:other_config`,
    method: 'post',
    tags: ['sdn-controller'],
    params: PARAMS_ID,
    query: QUERY_SYNC,
    body: BODY_ADD_RULE,
    responses: [{ status: 204, description: 'Rule added successfully' }],
    middlewares: jsonAndAcl(resource.acl),
    callback: ({ req, createAction }) => {
      const rule = ruleFromBody(req, resource.idKey, true)
      return createAction(() => resource.addRule(controller, rule), {
        sync: req.query.sync ?? false,
        statusCode: 204,
        taskProperties: { name: `add ${resource.acl} traffic rule`, objectId: rule[resource.idKey] },
      })
    },
  }
}

function deleteRuleRoute(controller, resource) {
  return {
    endpoint: `/${resource.collection}/{id}/actions/delete_traffic_rule`,
    description: `Delete a traffic rule from a ${resource.type}.\n\nRequired privilege:\n - resource: ${resource.acl}, action: update:other_config`,
    method: 'post',
    tags: ['sdn-controller'],
    params: PARAMS_ID,
    query: QUERY_SYNC,
    body: BODY_DELETE_RULE,
    responses: [{ status: 204, description: 'Rule deleted successfully' }],
    middlewares: jsonAndAcl(resource.acl),
    callback: ({ req, createAction }) => {
      const rule = ruleFromBody(req, resource.idKey, false)
      return createAction(() => resource.deleteRule(controller, rule), {
        sync: req.query.sync ?? false,
        statusCode: 204,
        taskProperties: { name: `delete ${resource.acl} traffic rule`, objectId: rule[resource.idKey] },
      })
    },
  }
}

function updateRuleRoute(controller, resource) {
  return {
    endpoint: `/${resource.collection}/{id}/actions/update_traffic_rule`,
    description: `Update a rule on a ${resource.type}, needs the exact old rule fields.\n\nRequired privilege:\n - resource: ${resource.acl}, action: update:other_config`,
    method: 'post',
    tags: ['sdn-controller'],
    params: PARAMS_ID,
    query: QUERY_SYNC,
    body: BODY_UPDATE_RULE,
    responses: [
      { status: 204, description: 'Rule updated successfully' },
      { status: 404, description: `Old rule does not exist on this ${resource.type}` },
    ],
    middlewares: jsonAndAcl(resource.acl),
    callback: ({ req, createAction }) => {
      const { oldRule, newRule: partialNewRule } = req.body
      const id = req.params.id
      return createAction(
        async () => {
          const object = controller._xo.getObject(id, resource.type)
          const rules = parseRules(object.other_config[SDN_CONTROLLER_OF_RULES_KEY])
          if (!rules.some(rule => rulesEqual(rule, oldRule))) {
            throw noSuchObject(JSON.stringify(oldRule), 'traffic-rule')
          }
          const newRule = { ...oldRule, ...partialNewRule }
          await resource.deleteRule(controller, { ...oldRule, [resource.idKey]: id })
          await resource.addRule(controller, { ...newRule, [resource.idKey]: id })
        },
        {
          sync: req.query.sync ?? false,
          statusCode: 204,
          taskProperties: {
            name: `update ${resource.acl} traffic rule`,
            objectId: id,
            params: req.body,
            objectType: resource.type,
          },
        }
      )
    },
  }
}

export function createRestRoutes(controller) {
  return flatMap(RESOURCES, r => [
    addRuleRoute(controller, r),
    deleteRuleRoute(controller, r),
    updateRuleRoute(controller, r),
  ])
}
