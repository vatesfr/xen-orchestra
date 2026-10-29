import type { XoKubernetesCluster } from '@/modules/kubernetes/types/xo-kubernetes.type.ts'
import {
  nodeCurrentOperation,
  nodeIconState,
  nodeReadyStatus,
  nodeSchedulingStatus,
} from '@/modules/kubernetes/utils/kubernetes-node.util.ts'
import { createKubernetesCluster } from '@/test/create-kubernetes-cluster.ts'
import { createKubernetesNode } from '@/test/create-kubernetes-node.ts'

describe('nodeReadyStatus', () => {
  it('returns ready when the node is Ready', () => {
    expect(nodeReadyStatus(createKubernetesNode({ status: 'Ready' }))).toBe('ready')
  })

  it('returns not-ready when the node is NotReady', () => {
    expect(nodeReadyStatus(createKubernetesNode({ status: 'NotReady' }))).toBe('not-ready')
  })

  it('returns unknown when the node status is Unknown', () => {
    expect(nodeReadyStatus(createKubernetesNode({ status: 'Unknown' }))).toBe('unknown')
  })
})

describe('nodeSchedulingStatus', () => {
  it('returns schedulable when the node is neither cordoned nor draining', () => {
    expect(nodeSchedulingStatus(createKubernetesNode())).toBe('schedulable')
  })

  it('returns schedulable when the API does not send the cordon flags yet', () => {
    const node = createKubernetesNode({ is_cordon: undefined, is_draining: undefined })

    expect(nodeSchedulingStatus(node)).toBe('schedulable')
  })

  it('returns cordoned when the node is cordoned', () => {
    expect(nodeSchedulingStatus(createKubernetesNode({ is_cordon: true }))).toBe('cordoned')
  })

  it('returns draining when the node is cordoned and draining', () => {
    expect(nodeSchedulingStatus(createKubernetesNode({ is_cordon: true, is_draining: true }))).toBe('draining')
  })
})

describe('nodeIconState', () => {
  it('returns undefined when the node is schedulable and its reconciliation is running', () => {
    expect(nodeIconState(createKubernetesNode())).toBeUndefined()
  })

  it('returns paused when the node reconciliation is paused', () => {
    expect(nodeIconState(createKubernetesNode({ is_reconciliation_paused: true }))).toBe('paused')
  })

  it('returns cordoned when the node is cordoned', () => {
    expect(nodeIconState(createKubernetesNode({ is_cordon: true }))).toBe('cordoned')
  })

  it('returns cordoned when the node is draining', () => {
    expect(nodeIconState(createKubernetesNode({ is_draining: true }))).toBe('cordoned')
  })

  it('returns cordoned when the node is cordoned and its reconciliation is paused', () => {
    expect(nodeIconState(createKubernetesNode({ is_cordon: true, is_reconciliation_paused: true }))).toBe('cordoned')
  })
})

describe('nodeCurrentOperation', () => {
  const settledNodesStatus: XoKubernetesCluster['control_plane_status'] = {
    available_replicas: 1,
    desired_replicas: 1,
    ready_replicas: 1,
    up_to_date_replicas: 1,
    replicas: 1,
    versions: [],
  }

  const createSettledCluster = (overrides: Partial<XoKubernetesCluster> = {}) =>
    createKubernetesCluster({
      control_plane_status: settledNodesStatus,
      worker_status: settledNodesStatus,
      ...overrides,
    })

  it('returns undefined when neither the node nor its cluster has an operation in progress', () => {
    expect(nodeCurrentOperation(createKubernetesNode(), createSettledCluster())).toBeUndefined()
  })

  it('returns undefined when the cluster is not found', () => {
    expect(nodeCurrentOperation(createKubernetesNode(), undefined)).toBeUndefined()
  })

  it('returns draining when the node is draining, even while its cluster is upgrading', () => {
    const node = createKubernetesNode({ is_draining: true })

    expect(nodeCurrentOperation(node, createSettledCluster({ is_upgrading: true }))).toBe('draining')
  })

  it('returns draining when the node is draining and its cluster is not found', () => {
    expect(nodeCurrentOperation(createKubernetesNode({ is_draining: true }), undefined)).toBe('draining')
  })

  it('returns the cluster operation when the cluster is deleting', () => {
    expect(nodeCurrentOperation(createKubernetesNode(), createSettledCluster({ phase: 'Deleting' }))).toBe('deleting')
  })

  it('returns the cluster operation when the cluster is flagged as deleting', () => {
    expect(nodeCurrentOperation(createKubernetesNode(), createSettledCluster({ is_deleting: true }))).toBe('deleting')
  })

  it('returns the cluster operation when the cluster is upgrading', () => {
    expect(nodeCurrentOperation(createKubernetesNode(), createSettledCluster({ is_upgrading: true }))).toBe('upgrading')
  })

  it('returns the cluster operation when the cluster is scaling', () => {
    const cluster = createSettledCluster({ worker_status: { ...settledNodesStatus, desired_replicas: 3 } })

    expect(nodeCurrentOperation(createKubernetesNode(), cluster)).toBe('scaling')
  })

  it('ignores the cluster operations that do not affect its nodes', () => {
    expect(nodeCurrentOperation(createKubernetesNode(), createSettledCluster({ phase: 'Updating' }))).toBeUndefined()
    expect(
      nodeCurrentOperation(createKubernetesNode(), createSettledCluster({ phase: 'Provisioning' }))
    ).toBeUndefined()
  })
})
