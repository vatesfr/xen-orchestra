export type AppliancePackageStatus = 'update' | 'new' | 'removed' | 'unchanged'

export type AppliancePackage = {
  name: string
  installedVersion?: string
  availableVersion?: string
  status: AppliancePackageStatus
}
