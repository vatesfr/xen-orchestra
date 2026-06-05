import type { IconName } from '@core/icons'
import { createFetch, useAsyncState } from '@vueuse/core'
import { computed, ref } from 'vue'

const GITHUB_REPO = 'https://api.github.com/repos/vatesfr/xen-orchestra'
const FETCH_TIMEOUT_MS = 5_000

const useGithubFetch = createFetch({
  baseUrl: GITHUB_REPO,
  options: {
    immediate: false,
    timeout: FETCH_TIMEOUT_MS,
  },
})

export type SourceStatus =
  | { status: 'idle'; icon?: IconName }
  | { status: 'loading'; icon?: IconName }
  | { status: 'up-to-date'; icon: IconName; masterSha: string; masterUrl: string }
  | { status: 'drift'; icon: IconName; masterSha: string; masterUrl: string; nBehind: number; nAhead: number }
  | { status: 'drift-unknown'; icon?: IconName; masterSha: string; masterUrl: string }
  | { status: 'master-unavailable'; icon: IconName }

export function useXoGithubSourceStatus(currentCommit: string) {
  const githubEndpoint = ref('')
  const githubRequest = useGithubFetch(githubEndpoint).json()

  async function resolveSourceStatus(): Promise<SourceStatus> {
    if (currentCommit === '') {
      return { status: 'idle' }
    }

    githubEndpoint.value = '/commits/master'
    await githubRequest.execute()

    if (githubRequest.error.value !== null) {
      console.error(githubRequest.error.value)
      return { status: 'master-unavailable', icon: 'status:danger-circle' }
    }

    const { sha: masterSha, html_url: masterUrl } = githubRequest.data.value ?? {}
    if (masterSha === undefined || masterUrl === undefined) {
      return { status: 'master-unavailable', icon: 'status:danger-circle' }
    }

    if (masterSha === currentCommit) {
      return { status: 'up-to-date', icon: 'status:success-circle', masterSha, masterUrl }
    }

    githubEndpoint.value = `/compare/${masterSha}...${currentCommit}`
    await githubRequest.execute()

    if (githubRequest.error.value !== null) {
      console.error(githubRequest.error.value)
      return { status: 'drift-unknown', masterSha, masterUrl }
    }

    const { behind_by: nBehind, ahead_by: nAhead } = githubRequest.data.value ?? {}
    if (nBehind === undefined || nAhead === undefined) {
      return { status: 'drift-unknown', masterSha, masterUrl }
    }

    return {
      status: 'drift',
      icon: 'status:warning-circle',
      masterSha,
      masterUrl,
      nBehind,
      nAhead,
    }
  }

  const { state, isLoading } = useAsyncState(resolveSourceStatus, { status: 'idle' } as SourceStatus, {
    immediate: currentCommit !== '',
    resetOnExecute: false,
    throwError: false,
  })

  const status = computed<SourceStatus>(() => (isLoading.value ? { status: 'loading' } : state.value))

  return {
    status,
  }
}
