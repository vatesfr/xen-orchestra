import { type RouteLocationRaw, useRouter } from 'vue-router'

type UseRedirectAfterDeleteOptions = {
  isOnObjectPage: () => boolean
  redirectTo: RouteLocationRaw | (() => RouteLocationRaw | undefined)
}

export function useRedirectAfterDelete({ isOnObjectPage, redirectTo }: UseRedirectAfterDeleteOptions) {
  const router = useRouter()

  const redirect = async () => {
    if (!isOnObjectPage()) {
      return
    }

    const target = typeof redirectTo === 'function' ? redirectTo() : redirectTo

    if (target === undefined) {
      return
    }

    await router.push(target)
  }

  const redirectIfOnObjectPage = async (results: PromiseSettledResult<unknown>[] | undefined) => {
    const firstResult = results?.[0]

    if (firstResult?.status !== 'fulfilled') {
      return
    }

    await redirect()
  }

  return { redirect, redirectIfOnObjectPage }
}
