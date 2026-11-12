import { useXoKubernetesTreeDefinitions } from '@/modules/kubernetes/composables/xo-kubernetes-tree-definitions.composable.ts'
import { KUBERNETES_ROOT_ID } from '@/modules/kubernetes/types/xo-kubernetes.type.ts'
import KubernetesClusterTreeItem from '@/modules/treeview/components/KubernetesClusterTreeItem.vue'
import KubernetesNamespaceTreeItem from '@/modules/treeview/components/KubernetesNamespaceTreeItem.vue'
import KubernetesNodeTreeItem from '@/modules/treeview/components/KubernetesNodeTreeItem.vue'
import KubernetesPodTreeItem from '@/modules/treeview/components/KubernetesPodTreeItem.vue'
import KubernetesTreeItem from '@/modules/treeview/components/KubernetesTreeItem.vue'
import messages from '@intlify/unplugin-vue-i18n/messages'
import type { XoUiPlugin } from '@xen-orchestra/web/ui-plugin-sdk'
import { routes } from 'vue-router/auto-routes'

/**
 * Kubernetes UI plugin, loaded by XO6 at runtime with Module Federation (exposed as `xo_kubernetes/plugin`).
 */
const plugin: XoUiPlugin = {
  name: 'kubernetes',
  apiVersion: 1,
  routes,
  messages,
  tree: {
    useDefinitions: useXoKubernetesTreeDefinitions,
    itemComponents: {
      kubernetes: KubernetesTreeItem,
      'kubernetes-cluster': KubernetesClusterTreeItem,
      'kubernetes-node': KubernetesNodeTreeItem,
      'kubernetes-namespace': KubernetesNamespaceTreeItem,
      'kubernetes-pod': KubernetesPodTreeItem,
    },
    getActiveNodeId: route =>
      route.name === '/kubernetes' || route.name === '/kubernetes/clusters' ? KUBERNETES_ROOT_ID : undefined,
  },
}

export default plugin
