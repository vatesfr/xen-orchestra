import { flatMap } from 'lodash'
import { noSuchObject } from 'xo-common/api-errors.js'
import { SDN_CONTROLLER_OF_RULES_KEY } from '@vates/types'

const QUERY_SYNC = { sync: { type: 'boolean', optional: true } }

const PARAMS_ID = { id: { type: 'string', example: 'b97f4e69-d275-4b25-9dc9-c1ac4e9b3fa5' } }

// only the XAPI plugin sets one
const PRIORITY_FIELD = { type: 'number', example: 100, optional: true }

const RULE_FIELDS = {
  allow: { type: 'boolean', example: true },
  direction: { type: 'string', example: 'to' },
  ipRange: { type: 'string', example: '192.168.0.0/24' },
  protocol: { type: 'string', example: 'tcp' },
  port: { type: 'number', example: 443, optional: true },
  priority: PRIORITY_FIELD,
}

const PRIORITY_DESCRIPTION = [
  '`priority` is the OpenFlow priority of the rule, an integer from 0 to 65535, optional with the XAPI plugin and refused without it (`useDirectChannel` in the configuration). A rule without one has the OpenFlow default, 32768.',
  'Of the rules of a network matching a packet, network and VIF rules alike, the one with the highest priority applies: a rule of priority 30 applies before a rule of priority 20.',
  'Two rules of a network cannot be given the same priority.',
  'Leave room between priorities (100, 110, 120…, not 101, 102, 103…): a rule can then go between two others without renumbering them.',
].join(' ')

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
      priority: PRIORITY_FIELD,
    },
  },
}

const LISTED_RULE = {
  type: 'object',
  fields: {
    ...RULE_FIELDS,
    type: { type: 'enum', enum: ['network', 'VIF'], example: 'VIF' },
    sourceId: { type: 'string', example: 'f0a8a0f6-6c63-4a8e-b4d5-0f5e1d3a2c71' },
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

// The rules of a network or a VIF, as the list routes return them: a network rule's cookie is internal
function listedRules(object) {
  return parseRules(object.other_config[SDN_CONTROLLER_OF_RULES_KEY]).map(({ cookie, ...rule }) => ({
    ...rule,
    type: object.type,
    sourceId: object.id,
  }))
}

// Not those of snapshots and templates: XAPI copies a VIF's rules with it, but they never apply
function vmVifsOf(xo, networkId) {
  return xo
    .getObject(networkId, 'network')
    .VIFs.map(id => xo.getObject(id, 'VIF'))
    .filter(vif => xo.getObject(vif.$VM).type === 'VM')
}

// The rules of a network, then those of the VIFs of its VMs
export function listNetworkRules(xo, networkId) {
  return [xo.getObject(networkId, 'network'), ...vmVifsOf(xo, networkId)].flatMap(listedRules)
}

function rulesEqual(a, b) {
  return (
    a.allow === b.allow &&
    a.direction === b.direction &&
    a.ipRange === b.ipRange &&
    a.port === b.port &&
    a.priority === b.priority &&
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

function listNetworkRulesRoute(controller) {
  return {
    endpoint: '/networks/{id}/traffic_rules',
    description: `List the traffic rules of a network, then those of each VIF of its VMs. The VIFs of snapshots and templates, whose copies of the rules never apply, are left out.\n\n${PRIORITY_DESCRIPTION}\n\nRequired privileges:\n - resource: network, action: read\n - resource: vif, action: read, on every VIF of its VMs`,
    method: 'get',
    tags: ['sdn-controller'],
    params: PARAMS_ID,
    responses: [
      {
        status: 200,
        description: 'The rules of the network and of the VIFs of its VMs',
        schema: { type: 'array', items: LISTED_RULE },
      },
      { status: 403, description: 'Forbidden' },
      { status: 404, description: 'No network found for this ID' },
    ],
    middlewares: [
      {
        name: 'acl',
        acls: [
          { resource: 'network', action: 'read', objectId: 'params.id' },
          {
            resource: 'vif',
            action: 'read',
            objectIds: ({ req }) => vmVifsOf(controller._xo, req.params.id).map(vif => vif.id),
          },
        ],
      },
    ],
    callback: ({ req }) => listNetworkRules(controller._xo, req.params.id),
  }
}

function listVifRulesRoute(controller) {
  return {
    endpoint: '/vifs/{id}/traffic_rules',
    description: `List the traffic rules of a VIF.\n\n${PRIORITY_DESCRIPTION}\n\nRequired privilege:\n - resource: vif, action: read`,
    method: 'get',
    tags: ['sdn-controller'],
    params: PARAMS_ID,
    responses: [
      { status: 200, description: 'The rules of the VIF', schema: { type: 'array', items: LISTED_RULE } },
      { status: 403, description: 'Forbidden' },
      { status: 404, description: 'No VIF found for this ID' },
    ],
    middlewares: [{ name: 'acl', acls: { resource: 'vif', action: 'read', objectId: 'params.id' } }],
    callback: ({ req }) => listedRules(controller._xo.getObject(req.params.id, 'VIF')),
  }
}

function addRuleRoute(controller, resource) {
  return {
    endpoint: `/${resource.collection}/{id}/actions/add_traffic_rule`,
    description: `Add a traffic rule to a ${resource.type}.\n\n${PRIORITY_DESCRIPTION}\n\nRequired privilege:\n - resource: ${resource.acl}, action: update:other_config`,
    method: 'post',
    tags: ['sdn-controller'],
    params: PARAMS_ID,
    query: QUERY_SYNC,
    body: RULE_FIELDS,
    responses: [
      { status: 204, description: 'Rule added successfully' },
      { status: 404, description: `No ${resource.type} found for this ID` },
      { status: 409, description: 'Another rule of the network has this priority' },
      {
        status: 422,
        description: 'Invalid rule or priority, or priority given without the XAPI plugin',
      },
    ],
    middlewares: jsonAndAcl(resource.acl),
    callback: ({ req, createAction }) => {
      const rule = ruleFromBody(req, resource.idKey)
      return createAction(
        async () => {
          controller._checkTrafficRulePriority(rule, req.body.priority)
          await resource.addRule(controller, rule)
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
    description: `Delete a traffic rule from a ${resource.type}.\n\nRequired privilege:\n - resource: ${resource.acl}, action: update:other_config`,
    method: 'post',
    tags: ['sdn-controller'],
    params: PARAMS_ID,
    query: QUERY_SYNC,
    body: RULE_FIELDS,
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
    description: `Update a rule on a ${resource.type}: \`oldRule\` identifies the rule to update and must be given in full, its priority included, \`newRule\` is a partial update where a field set to \`null\` is removed from the rule.\n\n${PRIORITY_DESCRIPTION}\n\nRequired privilege:\n - resource: ${resource.acl}, action: update:other_config`,
    method: 'post',
    tags: ['sdn-controller'],
    params: PARAMS_ID,
    query: QUERY_SYNC,
    body: BODY_UPDATE_RULE,
    responses: [
      { status: 204, description: 'Rule updated successfully' },
      { status: 404, description: `Old rule does not exist on this ${resource.type}` },
      { status: 409, description: 'Another rule of the network has the new priority' },
      {
        status: 422,
        description: 'Invalid rule or priority, or priority given without the XAPI plugin',
      },
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
          const newRule = applyRulePatch(oldRule, partialNewRule)
          controller._checkTrafficRulePriority({ [resource.idKey]: id }, newRule.priority, oldRule.priority)

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
  return [
    listNetworkRulesRoute(controller),
    listVifRulesRoute(controller),
    ...flatMap(RESOURCES, r => [
      addRuleRoute(controller, r),
      deleteRuleRoute(controller, r),
      updateRuleRoute(controller, r),
    ]),
  ]
}
