import { defineRemoteResource } from '@core/packages/remote-resource/define-remote-resource.ts'
import { mountComposable } from '@core-test/mount-composable.ts'
import { flushPromises } from '@vue/test-utils'

const useThings = defineRemoteResource({
  url: (id: string) => `/rest/v0/things/${id}`,
  initialData: () => [] as unknown[],
  state: (things, context) => ({
    things,
    lastError: context.lastError,
    hasError: context.hasError,
    reload: context.forceReload,
  }),
})

describe('defineRemoteResource', () => {
  // e.g. the `{ error, data }` body of the REST API, to tell a missing license from another failure
  it('keeps the status and the body of an HTTP error in its cause', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => Response.json({ error: 'feature Unauthorized' }, { status: 403, statusText: 'Forbidden' }))
    )

    const { wrapper } = mountComposable(() => useThings({}, 'forbidden'))
    await flushPromises()

    expect(wrapper.vm.lastError?.message).toBe('Failed to fetch: Forbidden')
    expect(wrapper.vm.lastError?.cause).toEqual({ status: 403, body: { error: 'feature Unauthorized' } })
  })

  it('has no body in the cause of an error without JSON', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('Bad Gateway', { status: 502, statusText: 'Bad Gateway' }))
    )

    const { wrapper } = mountComposable(() => useThings({}, 'bad-gateway'))
    await flushPromises()

    expect(wrapper.vm.lastError?.cause).toEqual({ status: 502, body: undefined })
  })

  it('leaves the error state once a later fetch succeeds', async () => {
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(new Response(null, { status: 500, statusText: 'Internal Server Error' }))
      .mockResolvedValueOnce(Response.json(['thing']))
    vi.stubGlobal('fetch', fetch)

    const { wrapper } = mountComposable(() => useThings({}, 'error-then-ok'))
    await flushPromises()

    expect(wrapper.vm.hasError).toBe(true)

    wrapper.vm.reload()
    await flushPromises()

    expect(fetch).toHaveBeenCalledTimes(2)
    expect(wrapper.vm.hasError).toBe(false)
    expect(wrapper.vm.things).toEqual(['thing'])
  })
})
