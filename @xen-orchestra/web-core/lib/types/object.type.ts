export type ObjectType = 'vm' | 'host'

export type VmActions = 'reboot' | 'shutdown' | 'force-reboot' | 'force-shutdown'
export type HostActions =
  | 'enable'
  | 'disable'
  | 'shutdown'
  | 'start'
  | 'forget'
  | 'disable-and-evacuate-vm'
  | 'reboot'
  | 'force-reboot'
  | 'smart-reboot'
  | 'restart-toolstack'

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
}
