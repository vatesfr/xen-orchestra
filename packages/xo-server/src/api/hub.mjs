import { createCluster } from '../_hubKubernetesCluster.mjs'

createCluster.description = 'Creates a Kubernetes cluster'
createCluster.params = {
  clusterName: { type: 'string' },
  controlPlaneIpAddress: { type: 'string', optional: true },
  controlPlaneIpAddresses: {
    type: 'array',
    items: { type: 'string' },
    optional: true,
    uniqueItems: true,
  },
  gatewayIpAddress: { type: 'string', optional: true },
  controlPlanePoolSize: {
    type: 'integer',
    default: 1,
    enum: [1, 3, 5, 7],
  },
  k8sVersion: {
    type: 'string',
    pattern: '[0-9a-zA-Z.]+',
    optional: true,
  },
  nameservers: {
    type: 'array',
    items: { type: 'string' },
    optional: true,
  },
  nbNodes: { type: 'integer' },
  network: { type: 'string' },
  searches: {
    type: 'array',
    items: { type: 'string' },
    optional: true,
  },
  sr: { type: 'string' },
  sshKey: { type: 'string' },
  vipAddress: { type: 'string', optional: true },
  workerNodeIpAddresses: {
    type: 'array',
    items: { type: 'string' },
    optional: true,
  },
  xoUrl: { type: 'string' },
  useInsecureXoConnection: { type: 'boolean', default: false },
  customClusterPodCIDR: {
    type: 'string',
    optional: true,
    default: '10.1.0.0/16',
  },
  customClusterServiceCIDR: {
    type: 'string',
    optional: true,
    default: '10.152.183.0/24',
  },
}
createCluster.resolve = { sr: ['sr', 'SR', 'administrate'] }
createCluster.permission = 'admin'

export const recipe = {
  createKubernetesCluster: createCluster,
}
