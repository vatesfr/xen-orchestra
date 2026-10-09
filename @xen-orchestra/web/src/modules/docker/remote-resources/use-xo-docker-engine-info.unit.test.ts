import { useXoDockerEngineInfo } from '@/modules/docker/remote-resources/use-xo-docker-engine-info.ts'
import { mountComposable } from '@/test/mount-composable.ts'
import { flushPromises } from '@vue/test-utils'

// exercises `defineRemoteResource` of web-core through a real resource
it('leaves the error state once a later fetch succeeds', async () => {
  const fetch = vi
    .fn()
    .mockResolvedValueOnce(new Response(null, { status: 500, statusText: 'Internal Server Error' }))
    .mockResolvedValueOnce(Response.json({ status: 'connected', asOf: 0 }))
  vi.stubGlobal('fetch', fetch)

  const { wrapper } = mountComposable(() => useXoDockerEngineInfo({}, 'engine-error-then-ok'))
  await flushPromises()

  expect(wrapper.vm.hasDockerEngineInfoError).toBe(true)

  wrapper.vm.reloadDockerEngineInfo()
  await flushPromises()

  expect(fetch).toHaveBeenCalledTimes(2)
  expect(wrapper.vm.hasDockerEngineInfoError).toBe(false)
  expect(wrapper.vm.dockerEngineInfo).toEqual({ status: 'connected', asOf: 0 })
})
