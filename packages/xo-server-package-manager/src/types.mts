import type { UpgradablePackage } from '@vates/types'

export interface PackageManager {
  checkAvailable(): void
  updatePackageList(): Promise<void>
  listUpgradable(): Promise<UpgradablePackage[]>
  runUpgrade(packages?: string[]): Promise<void>
  runSystemUpgrade(): Promise<void>
  upgrade(packages?: string[]): Promise<UpgradeResult>
  systemUpgrade(): Promise<UpgradeResult>
  isRebootRequired(): boolean
}

export interface PackageManagerConfiguration {
  // placeholder — future options like:
  // refreshIntervalHours?: number
  // allowedRepositories?: string[]
}

export type RequiredAction = 'none' | 'restartServices' | 'restartXoServer' | 'restartSystem'

export interface UpgradeResult {
  success: boolean
  packagesUpgraded: string[]
  requiredAction: RequiredAction
  logFile: string
}
