import { nodeSchedulingStatus } from '@/modules/kubernetes/utils/kubernetes-node.util.ts'
import { createKubernetesNode } from '@/test/create-kubernetes-node.ts'

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
