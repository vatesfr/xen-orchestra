import { unauthorized } from 'xo-common/api-errors.js'

import { ApiError } from '../helpers/error.helper.mjs'
import { KubernetesService } from './kubernetes.service.mjs'
import type { RouteDefinition } from '../router/types.mjs'
import { SupportedActions } from '@xen-orchestra/acl'

// Every CAPI endpoint is proxied, the routes are mounted on a wildcard endpoint
export const KUBERNETES_WILDCARD_ENDPOINT = '/kubernetes/*'

const XO_PATH_PREFIX = '/kubernetes'
const CAPI_PATH_PREFIX = 'api/kubernetes'

// The only resource used by the rules for now, the privileges of a route are declared for
// a single resource
const KUBERNETES_ACL_RESOURCE = 'kubernetes-cluster'

//The methods proxied to CAPI
export const PROXIED_METHODS: readonly RouteDefinition['method'][] = ['get', 'post', 'put', 'patch', 'delete']

/**
 * Privilege required to use a kubernetes endpoint as a non administrator
 *
 * The endpoint is declared as it is exposed by XO (`/kubernetes/clusters/{id}/nodes`), with its parameters
 */
export type KubernetesAclRule = {
  method: RouteDefinition['method']
  endpoint: string
  privilege: { resource: typeof KUBERNETES_ACL_RESOURCE; action: SupportedActions<typeof KUBERNETES_ACL_RESOURCE> }
}

/**
 * The endpoints in this array can have their privileges configured,
 * otherwise they are only accessible to admins
 */
export const KUBERNETES_ACL_RULES: KubernetesAclRule[] = [
  {
    method: 'get',
    endpoint: '/kubernetes/clusters',
    privilege: {
      resource: 'kubernetes-cluster',
      action: 'read',
    },
  },
  {
    method: 'post',
    endpoint: '/kubernetes/clusters',
    privilege: {
      resource: 'kubernetes-cluster',
      action: 'create',
    },
  },
  {
    method: 'get',
    endpoint: '/kubernetes/clusters/{id}',
    privilege: {
      resource: 'kubernetes-cluster',
      action: 'read',
    },
  },
  {
    method: 'delete',
    endpoint: '/kubernetes/clusters/{id}',
    privilege: {
      resource: 'kubernetes-cluster',
      action: 'delete',
    },
  },
  {
    method: 'get',
    endpoint: '/kubernetes/clusters/{id}/config',
    privilege: {
      resource: 'kubernetes-cluster',
      action: 'read-config',
    },
  },
  {
    method: 'get',
    endpoint: '/kubernetes/clusters/{id}/nodes',
    privilege: {
      resource: 'kubernetes-cluster',
      action: 'read',
    },
  },
]

/**
 * Throws if the path cannot be safely forwarded to CAPI
 */
export function checkCAPISubPath(subPath: string): void {
  for (const segment of subPath.split('/')) {
    let decodedSegment
    try {
      decodedSegment = decodeURIComponent(segment)
    } catch (error) {
      throw new ApiError(`the path segment "${segment}" is not correctly encoded`, 400)
    }

    if (decodedSegment === '..' || decodedSegment.includes('/')) {
      throw new ApiError(`the path segment "${segment}" is not allowed`, 400)
    }
  }
}

export type KubernetesAclRuleMatch = {
  rule: KubernetesAclRule
  params: Record<string, string>
}

/**
 * Compiles the given rules to be matched against the method and the path of a request
 *
 * Exported for testing
 */
export function createAclRuleMatcher(
  rules: KubernetesAclRule[]
): (method: string, path: string) => KubernetesAclRuleMatch | undefined {
  const compiledRules = rules.map(rule => {
    const paramNames: string[] = []

    const source = rule.endpoint.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\\\{(\w+)\\\}/g, (_, name: string) => {
      paramNames.push(name)
      return '([^/]+)'
    })

    return { paramNames, regExp: new RegExp(`^${source}$`), rule }
  })

  return function findAclRule(method, path) {
    for (const { paramNames, regExp, rule } of compiledRules) {
      if (rule.method !== method) {
        continue
      }

      const match = regExp.exec(path)
      if (match === null) {
        continue
      }

      const params: Record<string, string> = {}
      paramNames.forEach((name, index) => {
        params[name] = decodeURIComponent(match[index + 1])
      })

      return { params, rule }
    }
  }
}

const findAclRule = createAclRuleMatcher(KUBERNETES_ACL_RULES)

function getRequestPath(req: { url: string }): string {
  const queryStart = req.url.indexOf('?')

  return queryStart === -1 ? req.url : req.url.slice(0, queryStart)
}

/**
 * Returns the action required to use the requested endpoint, or `undefined` when no
 * privilege is declared for it
 *
 * Exported for testing
 */
export function getAclAction(
  method: RouteDefinition['method'],
  req: { url: string }
): KubernetesAclRule['privilege']['action'] | undefined {
  return findAclRule(method, getRequestPath(req))?.rule.privilege.action
}

/**
 * Returns the objects the privileges are checked against
 *
 * Exported for testing
 */
export function getAclObjects(method: RouteDefinition['method'], req: { url: string }): [Record<string, string>] {
  return [findAclRule(method, getRequestPath(req))?.params ?? {}]
}

export const kubernetesRoutes: RouteDefinition[] = PROXIED_METHODS.map(method => ({
  method,
  endpoint: KUBERNETES_WILDCARD_ENDPOINT,
  tags: ['kubernetes'],
  middlewares: [
    {
      name: 'acl',
      acls: {
        resource: KUBERNETES_ACL_RESOURCE,
        action: ({ req }) => getAclAction(method, req),
        objects: ({ req }) => getAclObjects(method, req),
      },
    },
  ],
  callback: async ({ req, res, restApi }) => {
    const path = getRequestPath(req)

    // an endpoint without privilege can only be used by an administrator
    if (findAclRule(method, path) === undefined && restApi.getCurrentUser().permission !== 'admin') {
      throw unauthorized()
    }

    const CAPISubPath = path.slice(XO_PATH_PREFIX.length)

    checkCAPISubPath(CAPISubPath)

    await restApi.ioc.get(KubernetesService).forwardRequest(`${CAPI_PATH_PREFIX}${CAPISubPath}`, req, res)
  },
}))
