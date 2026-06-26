import { useRouter, type RouteLocationRaw } from 'vue-router'

type UseRedirectAfterDeleteOptions = {
  isOnObjectPage: () => boolean
  redirectTo: RouteLocationRaw | (() => RouteLocationRaw | undefined)
}

export function useRedirectAfterDelete({ isOnObjectPage, redirectTo }: UseRedirectAfterDeleteOptions) {
  const router = useRouter()

  const redirectIfOnObjectPage = async (results: PromiseSettledResult<unknown>[] | undefined) => {
    const firstResult = results?.[0]

    if (firstResult?.status !== 'fulfilled') {
      return
    }

    if (!isOnObjectPage()) {
      return
    }

    const target = typeof redirectTo === 'function' ? redirectTo() : redirectTo

    if (target === undefined) {
      return
    }

    await router.push(target)
  }

  return { redirectIfOnObjectPage }
}
