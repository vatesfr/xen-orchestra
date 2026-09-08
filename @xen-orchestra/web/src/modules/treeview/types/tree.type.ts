import type { FrontXoHost } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import type {
  FrontXoKubernetesCluster,
  FrontXoKubernetesNamespace,
  FrontXoKubernetesNode,
  FrontXoKubernetesPod,
  XoKubernetesRoot,
} from '@/modules/kubernetes/types/xo-kubernetes.type.ts'
import type { FrontXoPool } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import type { XoSite } from '@/modules/site/types/xo-site.type.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import type { Branch } from '@core/packages/tree/branch.ts'
import type { Leaf } from '@core/packages/tree/leaf.ts'

export type VmLeaf = Leaf<FrontXoVm, 'vm'>

export type HostBranch = Branch<FrontXoHost, VmLeaf, 'host'>

export type PoolBranch = Branch<FrontXoPool, HostBranch | VmLeaf, 'pool'>

export type SiteBranch = Branch<XoSite, PoolBranch, 'site'>

export type KubernetesPodLeaf = Leaf<FrontXoKubernetesPod, 'kubernetes-pod'>

export type KubernetesNamespaceBranch = Branch<FrontXoKubernetesNamespace, KubernetesPodLeaf, 'kubernetes-namespace'>

export type KubernetesNodeLeaf = Leaf<FrontXoKubernetesNode, 'kubernetes-node'>

export type KubernetesClusterBranch = Branch<
  FrontXoKubernetesCluster,
  KubernetesNodeLeaf | KubernetesNamespaceBranch,
  'kubernetes-cluster'
>

export type KubernetesBranch = Branch<XoKubernetesRoot, KubernetesClusterBranch, 'kubernetes'>
