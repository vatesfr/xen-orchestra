import type {
  XoKubernetesCluster,
  XoKubernetesNamespace,
  XoKubernetesNode,
  XoKubernetesPod,
  XoKubernetesRoot,
} from '@/modules/kubernetes/types/xo-kubernetes.type.ts'
import type { Branch } from '@core/packages/tree/branch.ts'
import type { Leaf } from '@core/packages/tree/leaf.ts'

export type KubernetesPodLeaf = Leaf<XoKubernetesPod, 'kubernetes-pod'>

export type KubernetesNamespaceBranch = Branch<XoKubernetesNamespace, KubernetesPodLeaf, 'kubernetes-namespace'>

export type KubernetesNodeLeaf = Leaf<XoKubernetesNode, 'kubernetes-node'>

export type KubernetesClusterBranch = Branch<
  XoKubernetesCluster,
  KubernetesNodeLeaf | KubernetesNamespaceBranch,
  'kubernetes-cluster'
>

export type KubernetesBranch = Branch<XoKubernetesRoot, KubernetesClusterBranch, 'kubernetes'>
