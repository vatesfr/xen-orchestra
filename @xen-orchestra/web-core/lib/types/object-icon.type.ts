import type { IconDefinition } from '@fortawesome/fontawesome-common-types'

export type ObjectIconSize = 'extra-small' | 'small' | 'medium'

export type VmState = 'running' | 'halted' | 'paused' | 'suspended'

export type HostState = 'running' | 'halted' | 'maintenance'

export type SrState = 'connected' | 'partially-connected' | 'disconnected'

export type BackupRepositoryState = 'connected' | 'disconnected'

export type NetworkState = 'connected' | 'disconnected'

export type SupportedStateByType = {
  host: HostState
  vm: VmState
  sr: SrState
  'backup-repository': BackupRepositoryState
  network: NetworkState
}

export type SupportedType = keyof SupportedStateByType

export type SupportedState<TType extends SupportedType> = SupportedStateByType[TType]

export type StatusConfig = {
  icon: IconDefinition
  color: `--${string}`
  translate: {
    x: [number, number, number]
    y: [number, number, number]
  }
}

export type TypeConfig<TType extends SupportedType> = {
  mainIcon: IconDefinition
  states: Record<SupportedState<TType>, StatusConfig>
}

export type ObjectIconConfig = {
  [K in SupportedType]: TypeConfig<K>
}
