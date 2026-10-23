export type ObjectType = 'vm' | 'host' | 'kubernetes-cluster' | 'kubernetes-node'

export type VmActions = 'reboot' | 'shutdown' | 'force-reboot' | 'force-shutdown'
export type HostActions =
  | 'enable'
  | 'disable'
  | 'shutdown'
  | 'start'
  | 'forget'
  | 'disable-and-evacuate-vms'
  | 'reboot'
  | 'force-reboot'
  | 'smart-reboot'
  | 'restart-toolstack'
  | 'detach'
  | 'emergency-shutdown'

export type KubernetesClusterActions = 'pause-reconciliation'

export type KubernetesNodeActions = 'pause-reconciliation'

export type VmBlockedOperations =
  | 'clean_shutdown'
  | 'hard_shutdown'
  | 'pause'
  | 'clean_reboot'
  | 'hard_reboot'
  | 'suspend'
  | 'destroy'

export type ActionsByObject = {
  vm: VmActions
  host: HostActions
  'kubernetes-cluster': KubernetesClusterActions
  'kubernetes-node': KubernetesNodeActions
}
