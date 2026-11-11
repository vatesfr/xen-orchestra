import { useXoDockerTreeContainerCollection } from '@/modules/docker/remote-resources/use-xo-docker-tree-container-collection.ts'
import type { FrontXoDockerEngine } from '@/modules/docker/types/docker.type.ts'
import { mountComposable } from '@/test/mount-composable.ts'
import { stubFetchResponse, stubFetchServerError } from '@/test/stub-fetch-response.ts'
import { flushPromises } from '@vue/test-utils'

const WEB = { id: 'e-a_web', name: 'web', state: 'running', $engine: 'e-a', $VM: 'vm-a' }

function mountCollection(engineIdChunks: string[][]) {
  return mountComposable(() => useXoDockerTreeContainerCollection(engineIdChunks as FrontXoDockerEngine['id'][][]))
    .wrapper
}

it('lists the containers of the engines, one request per chunk, without stats', async () => {
  const fetchMock = stubFetchResponse(200, [WEB])

  const wrapper = mountCollection([['e-a', 'e-b']])
  await flushPromises()

  expect(fetchMock).toHaveBeenCalledTimes(1)
  const url = decodeURIComponent(String((fetchMock.mock.calls[0] as unknown[])[0]))
  expect(url).toContain('docker-containers?filter=$engine:|(e-a e-b)&fields=')
  expect(url).not.toContain('stats')
  expect(wrapper.vm.containersByEngine.get('e-a' as FrontXoDockerEngine['id'])).toEqual([WEB])
  expect([...wrapper.vm.loadedEngineIds]).toEqual(['e-a', 'e-b'])
})

it('lists nothing for engines which cannot be listed, which are loaded nonetheless', async () => {
  stubFetchServerError()

  const wrapper = mountCollection([['e-a']])
  await flushPromises()

  expect(wrapper.vm.containersByEngine.size).toBe(0)
  expect([...wrapper.vm.loadedEngineIds]).toEqual(['e-a'])
})

it('requests nothing without engines', async () => {
  const fetchMock = stubFetchResponse(200, [])

  mountCollection([])
  await flushPromises()

  expect(fetchMock).not.toHaveBeenCalled()
})
