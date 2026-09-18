import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  checkCAPISubPath,
  createAclRuleMatcher,
  getAclAction,
  getAclObjects,
  KUBERNETES_ACL_RULES,
  type KubernetesAclRule,
} from './kubernetes.routes.mjs'

const READ_CLUSTERS: KubernetesAclRule = {
  method: 'get',
  endpoint: '/kubernetes/clusters',
  privilege: { resource: 'kubernetes-cluster', action: 'read' },
}

const READ_CLUSTER: KubernetesAclRule = {
  method: 'get',
  endpoint: '/kubernetes/clusters/{id}',
  privilege: { resource: 'kubernetes-cluster', action: 'read' },
}

const READ_CLUSTER_CONFIG: KubernetesAclRule = {
  method: 'get',
  endpoint: '/kubernetes/clusters/{id}/config',
  privilege: { resource: 'kubernetes-cluster', action: 'read-config' },
}

const DELETE_CLUSTER: KubernetesAclRule = {
  method: 'delete',
  endpoint: '/kubernetes/clusters/{id}',
  privilege: { resource: 'kubernetes-cluster', action: 'delete' },
}

describe('createAclRuleMatcher', () => {
  const findAclRule = createAclRuleMatcher([READ_CLUSTERS, READ_CLUSTER, READ_CLUSTER_CONFIG, DELETE_CLUSTER])

  it('matches an endpoint without parameter', () => {
    assert.deepEqual(findAclRule('get', '/kubernetes/clusters'), { params: {}, rule: READ_CLUSTERS })
  })

  it('matches an endpoint with a parameter and extracts it', () => {
    assert.deepEqual(findAclRule('get', '/kubernetes/clusters/cluster-1'), {
      params: { id: 'cluster-1' },
      rule: READ_CLUSTER,
    })
  })

  it('decodes the extracted parameters', () => {
    assert.deepEqual(findAclRule('get', '/kubernetes/clusters/my%20cluster')?.params, { id: 'my cluster' })
  })

  it('matches the sub paths of an endpoint with a parameter', () => {
    assert.equal(findAclRule('get', '/kubernetes/clusters/cluster-1/config')?.rule, READ_CLUSTER_CONFIG)
  })

  it('does not match a parameter on several path segments', () => {
    // `/kubernetes/clusters/{id}` must not match this path, which has no rule
    assert.equal(findAclRule('get', '/kubernetes/clusters/cluster-1/nodes'), undefined)
  })

  it('takes the method into account', () => {
    assert.equal(findAclRule('delete', '/kubernetes/clusters/cluster-1')?.rule, DELETE_CLUSTER)
    assert.equal(findAclRule('post', '/kubernetes/clusters/cluster-1'), undefined)
  })

  it('does not match an unknown endpoint', () => {
    assert.equal(findAclRule('get', '/kubernetes/quotas'), undefined)
  })

  it('does not match a partial path', () => {
    assert.equal(findAclRule('get', '/kubernetes/clusters/cluster-1/'), undefined)
    assert.equal(findAclRule('get', '/other/kubernetes/clusters'), undefined)
  })

  it('uses the first matching rule', () => {
    const other: KubernetesAclRule = { ...READ_CLUSTERS, privilege: { resource: 'kubernetes-cluster', action: '*' } }

    assert.equal(createAclRuleMatcher([READ_CLUSTERS, other])('get', '/kubernetes/clusters')?.rule, READ_CLUSTERS)
    assert.equal(createAclRuleMatcher([other, READ_CLUSTERS])('get', '/kubernetes/clusters')?.rule, other)
  })

  it('never matches when there is no rule', () => {
    assert.equal(createAclRuleMatcher([])('get', '/kubernetes/clusters'), undefined)
  })
})

describe('getAclAction', () => {
  it('returns the action declared for each endpoint', () => {
    assert.equal(getAclAction('get', { url: '/kubernetes/clusters' }), 'read')
    assert.equal(getAclAction('post', { url: '/kubernetes/clusters' }), 'create')
    assert.equal(getAclAction('get', { url: '/kubernetes/clusters/cluster-1' }), 'read')
    assert.equal(getAclAction('delete', { url: '/kubernetes/clusters/cluster-1' }), 'delete')
    assert.equal(getAclAction('get', { url: '/kubernetes/clusters/cluster-1/nodes' }), 'read')
    assert.equal(getAclAction('get', { url: '/kubernetes/clusters/cluster-1/config' }), 'read-config')
  })

  it('ignores the query string', () => {
    assert.equal(getAclAction('get', { url: '/kubernetes/clusters?fields=name' }), 'read')
  })

  it('returns undefined when no privilege is declared for the endpoint', () => {
    // the request is then refused by the callback, unless the user is an administrator
    assert.equal(getAclAction('get', { url: '/kubernetes/quotas' }), undefined)
    assert.equal(getAclAction('put', { url: '/kubernetes/clusters/cluster-1' }), undefined)
  })

  it('declares an action for every method and endpoint of the rules', () => {
    for (const { endpoint, method, privilege } of KUBERNETES_ACL_RULES) {
      const url = endpoint.replace(/\{\w+\}/g, 'cluster-1')

      assert.equal(getAclAction(method, { url }), privilege.action, `${method} ${endpoint}`)
    }
  })
})

describe('getAclObjects', () => {
  it('returns the parameters of the endpoint', () => {
    assert.deepEqual(getAclObjects('get', { url: '/kubernetes/clusters/cluster-1' }), [{ id: 'cluster-1' }])
    assert.deepEqual(getAclObjects('get', { url: '/kubernetes/clusters/cluster-1/config' }), [{ id: 'cluster-1' }])
  })

  it('returns a single empty object for an endpoint without parameter', () => {
    assert.deepEqual(getAclObjects('get', { url: '/kubernetes/clusters' }), [{}])
  })

  it('never returns an empty array, even when no rule matches', () => {
    // an empty array would make the privileges not be checked at all
    assert.deepEqual(getAclObjects('get', { url: '/kubernetes/quotas' }), [{}])
    assert.equal(getAclObjects('patch', { url: '/kubernetes/clusters' }).length, 1)
  })
})

describe('checkCAPISubPath', () => {
  it('accepts a regular path', () => {
    checkCAPISubPath('/clusters')
    checkCAPISubPath('/clusters/cluster-1/nodes')
    checkCAPISubPath('/clusters/my%20cluster')
  })

  it('refuses a parent directory segment', () => {
    assert.throws(() => checkCAPISubPath('/clusters/../../ping'), { status: 400 })
  })

  it('refuses an encoded parent directory segment', () => {
    assert.throws(() => checkCAPISubPath('/clusters/%2e%2e/ping'), { status: 400 })
  })

  it('refuses an encoded path separator', () => {
    assert.throws(() => checkCAPISubPath('/clusters/cluster%2f..%2fping'), { status: 400 })
  })

  it('refuses a malformed encoding', () => {
    assert.throws(() => checkCAPISubPath('/clusters/%zz'), { status: 400 })
  })
})
