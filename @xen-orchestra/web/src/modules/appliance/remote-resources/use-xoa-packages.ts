import type { AppliancePackage, AppliancePackageStatus } from '@/modules/appliance/types/appliance-package.type.ts'
import type { XoaPackage } from '@/modules/appliance/types/xoa-package.type.ts'
import { BASE_URL } from '@/shared/utils/fetch.util.ts'
import { defineRemoteResource } from '@core/packages/remote-resource/define-remote-resource.ts'
import { computed } from 'vue'

const XOA_PACKAGE_NAME = 'xoa'

function getPackageStatus(xoaPackage: XoaPackage): AppliancePackageStatus {
  if (xoaPackage.installedVersion === undefined) {
    return 'new'
  }

  if (xoaPackage.version === undefined) {
    return 'removed'
  }

  if (xoaPackage.version === xoaPackage.installedVersion) {
    return 'unchanged'
  }

  return 'update'
}

function toAppliancePackage(xoaPackage: XoaPackage): AppliancePackage {
  return {
    name: xoaPackage.name,
    installedVersion: xoaPackage.installedVersion,
    availableVersion: xoaPackage.version,
    status: getPackageStatus(xoaPackage),
  }
}

export const useXoaPackages = defineRemoteResource({
  url: `${BASE_URL}/plugins/xoa/packages`,
  cacheExpirationMs: false,
  pollingIntervalMs: false,
  initialData: () => undefined as { packages: XoaPackage[] } | undefined,
  state: (data, context) => {
    const packages = computed(() => {
      if (data.value === undefined) {
        return []
      }

      return data.value.packages.map(toAppliancePackage)
    })

    const hasUpdates = computed(() => packages.value.some(appliancePackage => appliancePackage.status !== 'unchanged'))

    const xoaPackage = computed(() =>
      packages.value.find(appliancePackage => appliancePackage.name === XOA_PACKAGE_NAME)
    )

    const currentVersion = computed(() => xoaPackage.value?.installedVersion)

    const nextVersion = computed(() => xoaPackage.value?.availableVersion)

    return {
      packages,
      hasUpdates,
      currentVersion,
      nextVersion,
      isCheckingUpdates: context.isFetching,
      hasCheckUpdatesError: context.hasError,
      checkUpdates: context.forceReload,
    }
  },
})
