import { BASE_URL } from '@/shared/utils/fetch.util.ts'
import { defineRemoteResource } from '@core/packages/remote-resource/define-remote-resource.ts'
import type { UpgradablePackage } from '@vates/types'
import { computed } from 'vue'

export type XoPackageUpdates = {
  packages: UpgradablePackage[]
  isRebootRequired: boolean
}

// served by the `package-manager` plugin
export const useXoPackageUpdates = defineRemoteResource({
  url: `${BASE_URL}/plugins/package-manager/updates`,
  initialData: (): XoPackageUpdates => ({ packages: [], isRebootRequired: false }),
  // listing calls apt on the appliance: only reload after a refresh or an upgrade
  pollingIntervalMs: false,
  state: (updates, context) => ({
    upgradablePackages: computed(() => updates.value.packages),
    isRebootRequired: computed(() => updates.value.isRebootRequired),
    arePackageUpdatesReady: context.isReady,
    hasPackageUpdatesFetchError: context.hasError,
  }),
})
