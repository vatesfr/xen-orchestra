import { flatMap } from 'lodash'
import { noSuchObject } from 'xo-common/api-errors.js'
import { SDN_CONTROLLER_OF_RULES_KEY } from '@vates/types'

import { findRule, parseRules } from './traffic-rules'

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
      priority: { type: 'number', example: 2, optional: true, nullable: true },
    },
  },
}

const LISTED_RULE_FIELDS = {
  priority: { type: 'number', example: 3 },
  allow: { type: 'boolean', example: true },
  protocol: { type: 'string', example: 'TCP' },
  port: { type: 'number', example: 443, optional: true },
  ipRange: { type: 'string', example: '192.168.0.0/24' },
  direction: { type: 'string', example: 'to' },
  type: { type: 'enum', enum: ['network', 'VIF'], example: 'VIF' },
  sourceId: { type: 'string', example: 'f0a8a0f6-6c63-4a8e-b4d5-0f5e1d3a2c71' },
  networkId: { type: 'string', example: 'b97f4e69-d275-4b25-9dc9-c1ac4e9b3fa5' },
  active: { type: 'boolean', example: true },
}

const PRIORITY_DESCRIPTION = [
  'With the XAPI plugin, `priority` is the rank of the rule among the rules of its network, network and VIF rules alike: of those matching a packet, the one with the smallest priority decides, 1 applying first.',
  `A rule given a priority ends up at that rank, the other rules keeping their order around it, and a priority past the last rule puts it last: the response gives the priority the rule got, and \`GET /rest/v0/plugins/sdn-controller/networks/{id}/traffic-rules\` lists them all, in order.`,
  'Beware that a rule allowing the traffic of a locked VIF lets it through before the anti-spoofing flows of XAPI. Without the XAPI plugin (`useDirectChannel` in the configuration), a priority is rejected.',
].join(' ')

const RESPONSE_PRIORITY = { priority: { type: 'number', example: 2 } }

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

// The ACL runs before the body is validated: a body that is not a rule fails closed
function isRule(value) {
  return typeof value === 'object' && value !== null && typeof value.protocol === 'string'
}

function hasPriority(vif, rule) {
  return findRule(vif, rule)?.ofPriority !== undefined
}

// Whether a VIF route request reorders the network's rules: it sets a priority, or changes or
// deletes a rule that has one, as every rule added since priorities has.
const REORDERS = {
  add: (vif, body) => !isRule(body) || body.priority != null || hasPriority(vif, body),
  delete: (vif, body) => !isRule(body) || hasPriority(vif, body),
  update: (vif, { oldRule, newRule }) =>
    !isRule(oldRule) ||
    typeof newRule !== 'object' ||
    newRule === null ||
    'priority' in newRule ||
    hasPriority(vif, oldRule),
}

// Else a user with privileges on a VIF only could put its rules above the network's. The
// middleware resolves `objectIds` in its try (a missing VIF is a 404), and `[]` checks nothing.
function networkAcl(reorders) {
  return {
    resource: 'network',
    action: 'update:other_config',
    objectIds: ({ req, restApi }) => {
      const vif = restApi.getObject(req.params.id, 'VIF')
      return reorders(vif, req.body) ? [vif.$network] : []
    },
  }
}

function jsonAndAcl(resource, reorders) {
  const acl = { resource: resource.acl, action: 'update:other_config', objectId: 'params.id' }
  return [{ name: 'json' }, { name: 'acl', acls: resource.type === 'VIF' ? [acl, networkAcl(reorders)] : [acl] }]
}

// `change` says when a VIF route needs the privilege on the network
function requiredPrivileges(resource, change) {
  const privilege = ` - resource: ${resource.acl}, action: update:other_config`
  if (resource.type !== 'VIF') {
    return `Required privilege:\n${privilege}`
  }
  return `Required privileges:\n${privilege}\n - resource: network, action: update:other_config, on the network of the VIF, ${change}`
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

function listRulesRoute(controller) {
  // The ACL and the callback must read the same list: a rule added between two reads would reach
  // the response without its VIF having been checked. One list per request, shared by both.
  const rulesByRequest = new WeakMap()
  const listRules = req => {
    let rules = rulesByRequest.get(req)
    if (rules === undefined) {
      rules = controller._listTrafficRules(req.params.id)
      rulesByRequest.set(req, rules)
    }
    return rules
  }

  return {
    endpoint: '/networks/{id}/traffic-rules',
    description: `List the traffic rules of a network and of the VIFs of its VMs by \`priority\`, their rank: the order in which they apply, 1 first. \`active\` is false for the rules of an unplugged VIF, which apply again once it is plugged: those of a halted VM are listed, as they keep their place. Rules from before priorities share the last rank until XO connects to the pool again and puts them last one after the other. Rules of the same priority, like the copies a clone or a replica makes, have no defined order between them. Without the XAPI plugin (\`useDirectChannel\` in the configuration), no rule has a priority: every rule reads 1, and the list only follows the network's rules, then those of its VIFs. The VIFs of snapshots and templates, which never apply, are not listed. Add \`ndjson\` to the query to get NDJSON.\n\nRequired privileges:\n - resource: network, action: read\n - resource: vif, action: read, on every VIF whose rules are listed`,
    method: 'get',
    tags: ['sdn-controller'],
    params: PARAMS_ID,
    responses: [
      {
        status: 200,
        description: 'The rules, by rank',
        schema: { type: 'array', items: { type: 'object', fields: LISTED_RULE_FIELDS } },
      },
      { status: 403, description: 'Access denied' },
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
            // the middleware resolves them within its try
            objectIds: ({ req }) => [
              ...new Set(
                listRules(req)
                  .filter(rule => rule.type === 'VIF')
                  .map(rule => rule.sourceId)
              ),
            ],
          },
        ],
      },
    ],
    callback: ({ req }) => listRules(req),
  }
}

function addRuleRoute(controller, resource) {
  return {
    endpoint: `/${resource.collection}/{id}/actions/add_traffic_rule`,
    description: `Add a traffic rule to a ${resource.type}, after the last rule of the network without a priority. A rule with the same protocol, port, IP range and direction is updated instead, and keeps its place without a priority.\n\n${PRIORITY_DESCRIPTION}\n\n${requiredPrivileges(resource, 'to give a priority, or to update a rule that has one')}`,
    method: 'post',
    tags: ['sdn-controller'],
    params: PARAMS_ID,
    query: QUERY_SYNC,
    body: { ...RULE_FIELDS, priority: { type: 'number', example: 1, optional: true } },
    responses: [
      { status: 200, description: 'Rule added, with the priority it got', schema: RESPONSE_PRIORITY },
      { status: 202, description: 'Action executed asynchronously' },
      { status: 204, description: 'Rule added, without the XAPI plugin' },
      { status: 403, description: 'Access denied' },
      { status: 404, description: `No ${resource.type} found for this ID` },
      { status: 409, description: 'No OpenFlow priority is left on the network' },
      {
        status: 422,
        description:
          'Invalid rule, priority not an integer from 1, priority without the XAPI plugin, or network not plugged to any host',
      },
    ],
    middlewares: jsonAndAcl(resource, REORDERS.add),
    callback: ({ req, createAction }) => {
      const rule = ruleFromBody(req, resource.idKey)
      controller._checkTrafficRulePriority(rule.priority)
      return createAction(() => controller._addTrafficRule(rule), {
        sync: req.query.sync ?? false,
        statusCode: 200,
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
    description: `Delete a traffic rule from a ${resource.type}.\n\n${requiredPrivileges(resource, 'to delete a rule that has a priority')}`,
    method: 'post',
    tags: ['sdn-controller'],
    params: PARAMS_ID,
    query: QUERY_SYNC,
    body: RULE_FIELDS,
    responses: [
      { status: 202, description: 'Action executed asynchronously' },
      { status: 204, description: 'Rule deleted successfully' },
      { status: 403, description: 'Access denied' },
      { status: 404, description: `No ${resource.type} found for this ID, or rule not found` },
      { status: 422, description: 'Network not plugged to any host' },
    ],
    middlewares: jsonAndAcl(resource, REORDERS.delete),
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
    description: `Update a rule on a ${resource.type}: \`oldRule\` identifies the rule to update and must be given in full, \`newRule\` is a partial update where a field set to \`null\` is removed from the rule. A \`newRule\` without \`priority\` keeps the place of the rule, and \`priority: null\` moves it after the last rule of the network.\n\n${PRIORITY_DESCRIPTION}\n\n${requiredPrivileges(resource, 'to give a priority, or to update a rule that has one')}`,
    method: 'post',
    tags: ['sdn-controller'],
    params: PARAMS_ID,
    query: QUERY_SYNC,
    body: BODY_UPDATE_RULE,
    responses: [
      { status: 200, description: 'Rule updated, with the priority it has', schema: RESPONSE_PRIORITY },
      { status: 202, description: 'Action executed asynchronously' },
      { status: 204, description: 'Rule updated, without the XAPI plugin' },
      { status: 403, description: 'Access denied' },
      { status: 404, description: `Old rule does not exist on this ${resource.type}` },
      { status: 409, description: 'Another rule has the new match, or no OpenFlow priority is left on the network' },
      {
        status: 422,
        description:
          'Invalid rule, priority not an integer from 1, priority without the XAPI plugin, or network not plugged to any host',
      },
    ],
    middlewares: jsonAndAcl(resource, REORDERS.update),
    callback: ({ req, createAction }) => {
      const { oldRule, newRule: partialNewRule } = req.body
      // a rank, `null` or nothing, which mean another thing than for the other fields
      const { priority, ...patch } = partialNewRule
      const id = req.params.id
      // `null` is not checked: it moves the rule last, or is ignored without the XAPI plugin
      controller._checkTrafficRulePriority(priority)
      return createAction(
        async () => {
          const object = controller._xo.getObject(id, resource.type)
          const rules = parseRules(object.other_config[SDN_CONTROLLER_OF_RULES_KEY])
          const stored = rules.find(rule => rulesEqual(rule, oldRule))
          if (stored === undefined) {
            throw noSuchObject(JSON.stringify(oldRule), 'traffic-rule')
          }
          // the stored rule keeps what `oldRule` omits, but its OpenFlow priority is not a rank
          const { ofPriority, ...storedRule } = stored
          const newRule = { ...applyRulePatch(storedRule, patch), priority }

          return controller._updateTrafficRule({ [resource.idKey]: id }, oldRule, newRule)
        },
        {
          sync: req.query.sync ?? false,
          statusCode: 200,
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
  const routes = flatMap(RESOURCES, r => [
    addRuleRoute(controller, r),
    deleteRuleRoute(controller, r),
    updateRuleRoute(controller, r),
  ])
  return [listRulesRoute(controller), ...routes]
}
