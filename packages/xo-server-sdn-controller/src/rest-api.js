import { flatMap } from 'lodash'
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

const BODY_UPDATE_RULE = {
  oldRule: { type: 'object', fields: RULE_FIELDS },
  newRule: {
    type: 'object',
    fields: {
      allow: { type: 'boolean', example: true, optional: true },
      direction: { type: 'string', example: 'to', optional: true },
      ipRange: { type: 'string', example: '10.0.0.0/8', optional: true },
      protocol: { type: 'string', example: 'tcp', optional: true },
      port: { type: 'number', example: 80, optional: true, nullable: true },
      priority: { type: 'number', example: 40000, optional: true, nullable: true },
    },
  },
}

const PRIORITY_DESCRIPTION =
  'With the XAPI plugin, `priority` is the OpenFlow priority of the rule, an integer from 0 to 65535: of the rules of a network, network and VIF rules alike, the highest one matching a packet decides. It must not be used by another rule of the network. Without one, the rule has the OpenFlow default, 32768.'

// network and vif traffic-rule routes only differ by these tokens
const RESOURCES = [
  {
    collection: 'networks',
    acl: 'network',
    type: 'network',
    idKey: 'networkId',
  },
  {
    collection: 'vifs',
    acl: 'vif',
    type: 'VIF',
    idKey: 'vifId',
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

// Apply a partial update on a rule: a `null` value removes the field
function applyRulePatch(oldRule, patch) {
  const rule = { ...oldRule }
  for (const [key, value] of Object.entries(patch)) {
    if (value === null) {
      delete rule[key]
    } else if (value !== undefined) {
      rule[key] = value
    }
  }
  return rule
}

function ruleFromBody(req, idKey) {
  const rule = {
    allow: req.body.allow,
    direction: req.body.direction,
    ipRange: req.body.ipRange,
    protocol: req.body.protocol,
    [idKey]: req.params.id,
  }
  if (req.body.port != null) {
    rule.port = req.body.port
  }
  if (req.body.priority != null) {
    rule.priority = req.body.priority
  }
  return rule
}

function addRuleRoute(controller, resource) {
  return {
    endpoint: `/${resource.collection}/{id}/actions/add_traffic_rule`,
    description: `Add a traffic rule to a ${resource.type}.\n\n${PRIORITY_DESCRIPTION}\n\nRequired privilege:\n - resource: ${resource.acl}, action: update:other_config`,
    method: 'post',
    tags: ['sdn-controller'],
    params: PARAMS_ID,
    query: QUERY_SYNC,
    body: { ...RULE_FIELDS, priority: { type: 'number', example: 40000, optional: true } },
    responses: [
      { status: 204, description: 'Rule added successfully' },
      { status: 403, description: 'Access denied' },
      { status: 404, description: `No ${resource.type} found for this ID` },
      { status: 409, description: 'Another rule of the network has this priority' },
      { status: 422, description: 'Priority is not an integer from 0 to 65535' },
    ],
    middlewares: jsonAndAcl(resource.acl),
    callback: ({ req, createAction }) => {
      const rule = ruleFromBody(req, resource.idKey)
      return createAction(() => controller._addTrafficRule(rule), {
        sync: req.query.sync ?? false,
        statusCode: 204,
        taskProperties: {
          name: `add ${resource.acl} traffic rule`,
          objectId: rule[resource.idKey],
          objectType: resource.type,
          params: req.body,
        },
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
    body: RULE_FIELDS,
    responses: [
      { status: 204, description: 'Rule deleted successfully' },
      { status: 403, description: 'Access denied' },
      { status: 404, description: `No ${resource.type} found for this ID, or rule not found` },
    ],
    middlewares: jsonAndAcl(resource.acl),
    callback: ({ req, createAction }) => {
      const rule = ruleFromBody(req, resource.idKey)
      const id = req.params.id
      return createAction(
        async () => {
          const object = controller._xo.getObject(id, resource.type)
          const rules = parseRules(object.other_config[SDN_CONTROLLER_OF_RULES_KEY])
          if (!rules.some(r => rulesEqual(r, rule))) {
            throw noSuchObject(JSON.stringify(rule), 'traffic-rule')
          }
          await controller._deleteTrafficRule(rule)
        },
        {
          sync: req.query.sync ?? false,
          statusCode: 204,
          taskProperties: {
            name: `delete ${resource.acl} traffic rule`,
            objectId: rule[resource.idKey],
            objectType: resource.type,
            params: req.body,
          },
        }
      )
    },
  }
}

function updateRuleRoute(controller, resource) {
  return {
    endpoint: `/${resource.collection}/{id}/actions/update_traffic_rule`,
    description: `Update a rule on a ${resource.type}: \`oldRule\` identifies the rule to update and must be given in full, \`newRule\` is a partial update where a field set to \`null\` is removed from the rule.\n\n${PRIORITY_DESCRIPTION}\n\nRequired privilege:\n - resource: ${resource.acl}, action: update:other_config`,
    method: 'post',
    tags: ['sdn-controller'],
    params: PARAMS_ID,
    query: QUERY_SYNC,
    body: BODY_UPDATE_RULE,
    responses: [
      { status: 204, description: 'Rule updated successfully' },
      { status: 403, description: 'Access denied' },
      { status: 404, description: `Old rule does not exist on this ${resource.type}` },
      { status: 409, description: 'Another rule has the new match, or another rule of the network the new priority' },
      { status: 422, description: 'Priority is not an integer from 0 to 65535' },
    ],
    middlewares: jsonAndAcl(resource.acl),
    callback: ({ req, createAction }) => {
      const { oldRule, newRule: partialNewRule } = req.body
      const id = req.params.id
      return createAction(
        async () => {
          const object = controller._xo.getObject(id, resource.type)
          const rules = parseRules(object.other_config[SDN_CONTROLLER_OF_RULES_KEY])
          const stored = rules.find(rule => rulesEqual(rule, oldRule))
          if (stored === undefined) {
            throw noSuchObject(JSON.stringify(oldRule), 'traffic-rule')
          }
          // patching the stored rule keeps what `oldRule` does not mention, like the
          // priority
          const newRule = applyRulePatch(stored, partialNewRule)

          await controller._updateTrafficRule({ [resource.idKey]: id }, oldRule, newRule)
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
