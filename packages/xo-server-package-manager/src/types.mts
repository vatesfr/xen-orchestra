export interface PackageManagerConfiguration {
  // placeholder — future options like:
  // refreshIntervalHours?: number
  // allowedRepositories?: string[]
}

export type RequiredAction = 'none' | 'restartServices' | 'restartXoServer' | 'restartSystem'

export interface UpgradeProgress {
  status: 'running' | 'completed' | 'failed' | 'interrupted'
  currentPackage?: string
  currentIndex?: number
  totalPackages?: number
  percentage?: number
}

export interface UpgradeResult {
  success: boolean
  packagesUpgraded: string[]
  requiredAction: RequiredAction
  logFile: string
}

export interface OperationState {
  pid: number
  startedAt: number
  operation: 'upgrade' | 'systemUpgrade'
  packages?: string[]
}
