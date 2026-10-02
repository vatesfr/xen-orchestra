import { flatMap } from 'lodash'
import { incorrectState, invalidParameters, noSuchObject } from 'xo-common/api-errors.js'
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

// A network route can name a VIF rule by its MAC, the only way to reach one
// whose VIF no longer exists (ordered list only)
const MAC_FIELD = { mac: { type: 'string', example: '6e:0b:9e:72:ab:c6', optional: true } }

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
    },
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
    getNetwork: (controller, id) => controller._xo.getXapiObject(controller._xo.getObject(id, 'network')),
    deleteFields: { ...RULE_FIELDS, ...MAC_FIELD },
  },
  {
    collection: 'vifs',
    acl: 'vif',
    type: 'VIF',
    idKey: 'vifId',
    addRule: (controller, rule) => controller._addRule(rule),
    deleteRule: (controller, rule) => controller._deleteRule(rule),
    getNetwork: (controller, id) => controller._xo.getXapiObject(controller._xo.getObject(id, 'VIF')).$network,
    deleteFields: RULE_FIELDS,
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
    body: RULE_FIELDS,
    responses: [
      { status: 204, description: 'Rule added successfully' },
      { status: 404, description: `No ${resource.type} found for this ID` },
    ],
    middlewares: jsonAndAcl(resource.acl),
    callback: ({ req, createAction }) => {
      const rule = ruleFromBody(req, resource.idKey)
      return createAction(
        async () => {
          const trafficRules = await controller._trafficRulesFor(resource.getNetwork(controller, req.params.id))
          await (trafficRules === undefined ? resource.addRule(controller, rule) : trafficRules.addRule(rule))
        },
        {
          sync: req.query.sync ?? false,
          statusCode: 204,
          taskProperties: {
            name: `add ${resource.acl} traffic rule`,
            objectId: rule[resource.idKey],
            objectType: resource.type,
            params: req.body,
          },
        }
      )
    },
  }
}

function deleteRuleRoute(controller, resource) {
  return {
    endpoint: `/${resource.collection}/{id}/actions/delete_traffic_rule`,
    description:
      resource.type === 'network'
        ? `Delete a traffic rule from a ${resource.type}.\n\n\`mac\` names a VIF rule by the MAC of its VIF, even one that no longer exists.\n\nRequired privilege:\n - resource: ${resource.acl}, action: update:other_config`
        : `Delete a traffic rule from a ${resource.type}.\n\nRequired privilege:\n - resource: ${resource.acl}, action: update:other_config`,
    method: 'post',
    tags: ['sdn-controller'],
    params: PARAMS_ID,
    query: QUERY_SYNC,
    body: resource.deleteFields,
    responses: [
      { status: 204, description: 'Rule deleted successfully' },
      { status: 404, description: `No ${resource.type} found for this ID, or rule not found` },
    ],
    middlewares: jsonAndAcl(resource.acl),
    callback: ({ req, createAction }) => {
      const rule = ruleFromBody(req, resource.idKey)
      const id = req.params.id
      return createAction(
        async () => {
          const trafficRules = await controller._trafficRulesFor(resource.getNetwork(controller, id))
          if (trafficRules !== undefined) {
            return trafficRules.deleteRule({ ...rule, mac: resource.type === 'network' ? req.body.mac : undefined })
          }
          if (resource.type === 'network' && req.body.mac !== undefined) {
            throw invalidParameters('`mac` needs a network that uses the ordered traffic-rule list')
          }
          const object = controller._xo.getObject(id, resource.type)
          const rules = parseRules(object.other_config[SDN_CONTROLLER_OF_RULES_KEY])
          if (!rules.some(r => rulesEqual(r, rule))) {
            throw noSuchObject(JSON.stringify(rule), 'traffic-rule')
          }
          await resource.deleteRule(controller, rule)
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
    description:
      resource.type === 'network'
        ? `Update a rule on a ${resource.type}: \`oldRule\` identifies the rule to update and must be given in full, \`newRule\` is a partial update where a field set to \`null\` is removed from the rule.\n\nOn a network that uses the ordered list, the rule keeps its place.\n\nRequired privilege:\n - resource: ${resource.acl}, action: update:other_config`
        : `Update a rule on a ${resource.type}: \`oldRule\` identifies the rule to update and must be given in full, \`newRule\` is a partial update where a field set to \`null\` is removed from the rule.\n\nRequired privilege:\n - resource: ${resource.acl}, action: update:other_config`,
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
          const newRule = applyRulePatch(oldRule, partialNewRule)
          const trafficRules = await controller._trafficRulesFor(resource.getNetwork(controller, id))
          if (trafficRules !== undefined) {
            return trafficRules.updateRule({ [resource.idKey]: id }, oldRule, newRule)
          }
          const object = controller._xo.getObject(id, resource.type)
          const rules = parseRules(object.other_config[SDN_CONTROLLER_OF_RULES_KEY])
          if (!rules.some(rule => rulesEqual(rule, oldRule))) {
            throw noSuchObject(JSON.stringify(oldRule), 'traffic-rule')
          }

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

const BODY_REORDER_RULES = {
  rules: {
    type: 'array',
    items: {
      type: 'object',
      fields: {
        type: { type: 'enum', enum: ['network', 'VIF'], example: 'VIF' },
        ...MAC_FIELD,
        ...RULE_FIELDS,
      },
    },
  },
}

function reorderRulesRoute(controller) {
  return {
    endpoint: '/networks/{id}/actions/reorder_traffic_rules',
    description: `Reorder the traffic rules of a network: \`rules\` is its complete list, network and VIF rules alike, highest priority first, a VIF rule named by the MAC of its VIF.\n\nNeeds the XAPI plugin mode, and every host of the network to run an sdncontroller.py with cookie support.\n\nRequired privilege:\n - resource: network, action: update:other_config`,
    method: 'post',
    tags: ['sdn-controller'],
    params: PARAMS_ID,
    query: QUERY_SYNC,
    body: BODY_REORDER_RULES,
    responses: [
      { status: 204, description: 'Rules reordered successfully' },
      { status: 404, description: 'No network found for this ID' },
      {
        status: 409,
        description: 'The list does not match the current rules, or the network cannot use the ordered list',
      },
    ],
    middlewares: jsonAndAcl('network'),
    callback: ({ req, createAction }) => {
      const id = req.params.id
      return createAction(
        async () => {
          const trafficRules = controller._trafficRules
          if (trafficRules === undefined) {
            throw incorrectState({
              actual: 'channel',
              expected: 'xapi-plugin',
              object: id,
              property: 'xo:sdn-controller:of-method',
            })
          }
          await trafficRules.reorderRules(id, req.body.rules)
        },
        {
          sync: req.query.sync ?? false,
          statusCode: 204,
          taskProperties: {
            name: 'reorder network traffic rules',
            objectId: id,
            objectType: 'network',
            params: req.body,
          },
        }
      )
    },
  }
}

export function createRestRoutes(controller) {
  return [
    ...flatMap(RESOURCES, r => [
      addRuleRoute(controller, r),
      deleteRuleRoute(controller, r),
      updateRuleRoute(controller, r),
    ]),
    reorderRulesRoute(controller),
  ]
}
