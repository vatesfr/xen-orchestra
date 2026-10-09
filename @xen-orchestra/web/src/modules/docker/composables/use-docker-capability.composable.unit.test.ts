import { useDockerCapability } from '@/modules/docker/composables/use-docker-capability.composable.ts'
import { useXoDockerEngineCollection } from '@/modules/docker/remote-resources/use-xo-docker-engine-collection.ts'
import { mountComposable } from '@/test/mount-composable.ts'
import { flushPromises } from '@vue/test-utils'

function mountCapability(response: Response, filter: string) {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => response)
  )

  return mountComposable(() => {
    const { lastDockerEngineFetchError } = useXoDockerEngineCollection({}, filter)

    return useDockerCapability(lastDockerEngineFetchError)
  }).wrapper
}

// through the real remote resource: the error carries the status and the body of the answer
it('tells when the XOA plan does not include Docker', async () => {
  const wrapper = mountCapability(
    Response.json({ error: 'feature Unauthorized', data: { currentPlan: 'free' } }, { status: 403 }),
    '$VM:plan'
  )
  await flushPromises()

  expect(wrapper.vm.isDockerUnavailableWithPlan).toBe(true)
})

it('does not take another 403 for a plan limitation', async () => {
  const wrapper = mountCapability(Response.json({ error: 'not enough permissions' }, { status: 403 }), '$VM:acl')
  await flushPromises()

  expect(wrapper.vm.isDockerUnavailableWithPlan).toBe(false)
})
