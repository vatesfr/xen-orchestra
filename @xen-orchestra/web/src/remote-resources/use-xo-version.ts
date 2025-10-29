import type { XoVersion } from '@/types/xo/xo-version.type.ts'
import { defineRemoteResource } from '@core/packages/remote-resource/define-remote-resource.ts'
import { useLocalStorage } from '@vueuse/core'

const STATIC_XO_URLS_VERSION: XoVersion = {
  xo5: '/v5',
  xo6: '/v6',
  default: 'xo5',
}

export const useXoVersion = defineRemoteResource({
  url: '/rest/v0/xo-versions',
  initialData: () => ({}) as XoVersion,
  state: (rawVersions, context) => {
    const version = useLocalStorage(
      'xoVersions',
      // TODO To remove and replace by rawVersions.value when api will be available
      STATIC_XO_URLS_VERSION
    )

    function getUrlFollowingVersion(page: string, versionKey?: 'xo5' | 'xo6'): string {
      const key = versionKey || version.value.default

      if (version.value.default === 'xo5') {
        // it depends on the API data, maybe no need to find the key
        return `${version.value[key]}/${page}`
      }

      return `/${page}`
    }

    return {
      version,
      getUrlFollowingVersion,
      hasError: context.hasError,
    }
  },
})
