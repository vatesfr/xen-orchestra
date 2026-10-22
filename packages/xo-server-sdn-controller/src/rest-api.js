import { flatMap } from 'lodash'
import { noSuchObject } from 'xo-common/api-errors.js'
import { SDN_CONTROLLER_OF_RULES_KEY } from '@vates/types'

import { findRule } from './traffic-rules'

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

// A rule as the list of the rules of a network returns it
const LISTED_RULE_FIELDS = {
  priority: { type: 'number', example: 59995, optional: true },
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

const LIST_ENDPOINT = '/rest/v0/plugins/sdn-controller/networks/{id}/traffic-rules'

const PRIORITY_DESCRIPTION = [
  'With the XAPI plugin, `priority` is the OpenFlow priority of the rule: of the rules of a network, network and VIF rules alike, the one with the highest priority matching a packet decides.',
  `It is an integer from 8002 to 65535, above the flows XAPI installs for a locked VIF (4000 to 8000), and must not be used by another rule of the network: \`GET ${LIST_ENDPOINT}\` lists them all, in order.`,
  'Leave gaps between the priorities you choose, of 100 for instance, so that moving a rule between two others takes one update.',
  'A rule added without a priority is appended: it gets the lowest priority of the network minus 5, or 60000 for its first rule, so it is the last one of that list.',
  'Beware that a rule allowing the traffic of a locked VIF lets it through before the anti-spoofing flows of XAPI.',
  'Without the XAPI plugin (`useDirectChannel` in the configuration), a priority is rejected.',
].join(' ')

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

// The ACL middleware runs before the body is validated: a body which is not a rule
// counts as one changing the order, so that the check fails closed
function isRule(value) {
  return typeof value === 'object' && value !== null && typeof value.protocol === 'string'
}

// Whether a request to a VIF route changes the order of the rules of the network of
// the VIF: it sets a priority, or changes or deletes a rule that has one. A rule
// added since priorities always has one, so a user with privileges on the VIF only
// can add rules, appended to the network's, but not change them.
const REORDERS = {
  add: (vif, body) => !isRule(body) || body.priority != null || findRule(vif, body)?.priority !== undefined,
  delete: (vif, body) => !isRule(body) || findRule(vif, body)?.priority !== undefined,
  update: (vif, { oldRule, newRule }) =>
    !isRule(oldRule) ||
    typeof newRule !== 'object' ||
    newRule === null ||
    'priority' in newRule ||
    findRule(vif, oldRule)?.priority !== undefined,
}

// On a VIF route, a change of the order of the rules of the network also needs the
// privilege of the network routes: a user with privileges on a VIF could otherwise
// put its rules above those of the network. The middleware resolves `objectIds`
// within its try, where a missing VIF is a 404, and checks nothing for none.
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

// A missing field is no key, as for the legacy methods
function ruleFromBody(req, idKey) {
  const { allow, direction, ipRange, port, priority, protocol } = req.body
  return {
    allow,
    direction,
    ipRange,
    protocol,
    [idKey]: req.params.id,
    ...(port != null && { port }),
    ...(priority != null && { priority }),
  }
}

function listRulesRoute(controller) {
  return {
    endpoint: '/networks/{id}/traffic-rules',
    description: `List the traffic rules of a network and of the VIFs of its VMs, highest priority first: the order in which they apply. \`active\` is false for the rules of an unplugged VIF, which apply again once it is plugged: those of a halted VM are listed, as they keep their priority. A rule from before priorities, which has none until XO connects to the pool again, is listed last, as it applies after the others. Rules of the same priority, like the copies a clone or a replica makes, have no defined order. The VIFs of snapshots and templates, which never apply, are not listed. Add \`ndjson\` to the query to get NDJSON.\n\nRequired privileges:\n - resource: network, action: read\n - resource: vif, action: read, on every VIF whose rules are listed`,
    method: 'get',
    tags: ['sdn-controller'],
    params: PARAMS_ID,
    responses: [
      {
        status: 200,
        description: 'The rules, highest priority first',
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
                controller
                  ._listTrafficRules(req.params.id)
                  .filter(rule => rule.type === 'VIF')
                  .map(rule => rule.sourceId)
              ),
            ],
          },
        ],
      },
    ],
    callback: ({ req }) => controller._listTrafficRules(req.params.id),
  }
}

function addRuleRoute(controller, resource) {
  return {
    endpoint: `/${resource.collection}/{id}/actions/add_traffic_rule`,
    description: `Add a traffic rule to a ${resource.type}. A rule with the same protocol, port, IP range and direction is updated instead, and keeps its priority if none is given.\n\n${PRIORITY_DESCRIPTION}\n\n${requiredPrivileges(resource, 'to give a priority, or to update a rule that has one')}`,
    method: 'post',
    tags: ['sdn-controller'],
    params: PARAMS_ID,
    query: QUERY_SYNC,
    body: { ...RULE_FIELDS, priority: { type: 'number', example: 40000, optional: true } },
    responses: [
      { status: 202, description: 'Action executed asynchronously' },
      { status: 204, description: 'Rule added successfully' },
      { status: 403, description: 'Access denied' },
      { status: 404, description: `No ${resource.type} found for this ID` },
      {
        status: 409,
        description: `Another rule of the network has this priority, or no priority is left below the lowest one to append the rule: \`GET ${LIST_ENDPOINT}\` lists them`,
      },
      {
        status: 422,
        description: 'Invalid rule, priority not an integer from 8002 to 65535, or priority without the XAPI plugin',
      },
    ],
    middlewares: jsonAndAcl(resource, REORDERS.add),
    callback: ({ req, createAction }) => {
      const rule = ruleFromBody(req, resource.idKey)
      controller._checkTrafficRulePriority(rule.priority)
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
    description: `Update a rule on a ${resource.type}: \`oldRule\` identifies the rule to update and must be given in full, \`newRule\` is a partial update where a field set to \`null\` is removed from the rule. A \`newRule\` without \`priority\` keeps the priority of the rule, and \`priority: null\` moves it after the last rule of the network.\n\n${PRIORITY_DESCRIPTION}\n\n${requiredPrivileges(resource, 'to give a priority, or to update a rule that has one')}`,
    method: 'post',
    tags: ['sdn-controller'],
    params: PARAMS_ID,
    query: QUERY_SYNC,
    body: BODY_UPDATE_RULE,
    responses: [
      { status: 202, description: 'Action executed asynchronously' },
      { status: 204, description: 'Rule updated successfully' },
      { status: 403, description: 'Access denied' },
      { status: 404, description: `Old rule does not exist on this ${resource.type}` },
      {
        status: 409,
        description: `Another rule has the new match, another rule of the network has the new priority, or no priority is left below the lowest one to move the rule after it: \`GET ${LIST_ENDPOINT}\` lists them`,
      },
      {
        status: 422,
        description: 'Invalid rule, priority not an integer from 8002 to 65535, or priority without the XAPI plugin',
      },
    ],
    middlewares: jsonAndAcl(resource, REORDERS.update),
    callback: ({ req, createAction }) => {
      const { oldRule, newRule: partialNewRule } = req.body
      const id = req.params.id
      // `null` is not checked: it moves the rule last, or is ignored without the
      // XAPI plugin
      controller._checkTrafficRulePriority(partialNewRule.priority)
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
  return [
    listRulesRoute(controller),
    ...flatMap(RESOURCES, r => [
      addRuleRoute(controller, r),
      deleteRuleRoute(controller, r),
      updateRuleRoute(controller, r),
    ]),
  ]
}
