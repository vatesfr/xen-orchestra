import { useDockerContainerActionError } from '@/modules/docker/composables/use-docker-container-action-error.composable.ts'
import { useDockerContainerActions } from '@/modules/docker/composables/use-docker-container-actions.composable.ts'
import type { FrontXoDockerContainer } from '@/modules/docker/types/docker.type.ts'
import { createDockerContainer } from '@/test/create-docker-container.ts'
import { t } from '@/test/i18n.ts'
import { mountComposable } from '@/test/mount-composable.ts'
import { useOverlayStore } from '@core/packages/overlay/use-overlay-store.ts'
import { flushPromises } from '@vue/test-utils'
import { ref } from 'vue'

function mountActions(container: FrontXoDockerContainer, onSettled = vi.fn()) {
  const containerRef = ref(container)
  const { wrapper } = mountComposable(() => ({
    ...useDockerContainerActions(containerRef, { onSettled }),
    overlayStore: useOverlayStore(),
  }))

  return { wrapper, containerRef, onSettled }
}

function respondWith(status: number, body?: unknown) {
  return vi.fn(() =>
    Promise.resolve(
      new Response(body === undefined ? null : JSON.stringify(body), {
        status,
        headers: { 'Content-Type': 'application/json' },
      })
    )
  )
}

afterEach(() => {
  useDockerContainerActionError().clearDockerContainerActionError()
  vi.unstubAllGlobals()
  // back to the never-settling stub of `src/test/setup.ts`
  vi.stubGlobal(
    'fetch',
    vi.fn(() => new Promise(() => {}))
  )
})

describe('the action matrix', () => {
  it.each([
    ['running', [t('action:restart'), t('action:pause'), t('action:stop')], false],
    ['paused', [t('action:unpause'), t('action:stop')], false],
    ['restarting', [t('action:stop')], false],
    ['created', [t('action:start')], true],
    ['exited', [t('action:start')], true],
    ['dead', [t('action:start')], true],
    ['removing', [], false],
  ] as const)(
    'offers the lifecycle actions of a %s container, and the deletion when stopped',
    (state, labels, deletable) => {
      const { wrapper } = mountActions(createDockerContainer({ state }))

      const items = wrapper.vm.dockerContainerActionItems

      expect(items.map(item => item.label)).toEqual([...labels, t('action:delete')])

      const deleteItem = items.at(-1)!
      expect(deleteItem.disabled).toBe(!deletable)
      expect(deleteItem.hint).toBe(deletable ? undefined : t('docker-container-stop-before-delete'))
    }
  )

  it.each([
    ['running', t('action:stop')],
    ['paused', t('action:unpause')],
    ['exited', t('action:start')],
  ] as const)('makes the main action of a %s container %s', (state, label) => {
    const { wrapper } = mountActions(createDockerContainer({ state }))

    expect(wrapper.vm.primaryAction?.label).toBe(label)
  })
})

it('runs an action synchronously, per container, then asks for a refetch', async () => {
  let respond: (response: Response) => void = () => {}
  const fetch = vi.fn(() => new Promise<Response>(resolve => (respond = resolve)))
  vi.stubGlobal('fetch', fetch)

  const { wrapper, onSettled } = mountActions(createDockerContainer({ state: 'running' }))

  void wrapper.vm.runDockerContainerAction('restart')
  await flushPromises()

  expect(fetch).toHaveBeenCalledWith(
    '/rest/v0/docker-containers/engine-123_1b5d79f4a1c9275c5f9e1fc50629ea85ca807fe1c70f03e528e35f4b6ce1963e/actions/restart?sync=true',
    expect.objectContaining({ method: 'POST' })
  )

  // busy while it runs, the other actions disabled
  const items = wrapper.vm.dockerContainerActionItems
  expect(items.find(item => item.label === t('action:restart'))).toMatchObject({ busy: true, disabled: false })
  expect(items.find(item => item.label === t('action:stop'))).toMatchObject({ busy: false, disabled: true })
  expect(wrapper.vm.isDockerContainerBusy).toBe(true)
  expect(onSettled).not.toHaveBeenCalled()

  respond(new Response(null, { status: 204 }))
  await flushPromises()

  expect(wrapper.vm.isDockerContainerBusy).toBe(false)
  // no optimistic update: the state is the one of the next listing
  expect(onSettled).toHaveBeenCalledOnce()
})

it('reports a failed action, with the message of the API', async () => {
  vi.stubGlobal(
    'fetch',
    respondWith(409, {
      error: 'container is already paused',
      data: { code: 'DOCKER_API_ERROR', statusCode: 409 },
    })
  )

  const { wrapper, onSettled } = mountActions(createDockerContainer({ name: 'web', state: 'running' }))

  await wrapper.vm.runDockerContainerAction('pause')
  await flushPromises()

  expect(useDockerContainerActionError().dockerContainerActionError.value).toEqual({
    containerName: 'web',
    action: t('action:pause'),
    message: 'container is already paused',
  })
  expect(onSettled).toHaveBeenCalledOnce()
})

it('stops a container right away without a restart policy', async () => {
  const fetch = respondWith(204)
  vi.stubGlobal('fetch', fetch)

  const { wrapper } = mountActions(
    createDockerContainer({ state: 'running', restartPolicy: { name: 'no', maximumRetryCount: 0 } })
  )

  await wrapper.vm.runDockerContainerAction('stop')
  await flushPromises()

  expect(wrapper.vm.overlayStore.overlays).toHaveLength(0)
  expect(fetch).toHaveBeenCalledOnce()
})

it.each(['always', 'unless-stopped'])(
  'asks for a confirmation before stopping a container restarted "%s"',
  async name => {
    const fetch = respondWith(204)
    vi.stubGlobal('fetch', fetch)

    const { wrapper } = mountActions(
      createDockerContainer({ name: 'web', state: 'running', restartPolicy: { name, maximumRetryCount: 0 } })
    )

    void wrapper.vm.runDockerContainerAction('stop')
    await flushPromises()

    expect(fetch).not.toHaveBeenCalled()
    const [overlay] = wrapper.vm.overlayStore.overlays
    expect(overlay.props).toMatchObject({ name: 'web', policy: name })

    await (overlay.props.onConfirm as () => Promise<void>)()
    await flushPromises()

    expect(fetch).toHaveBeenCalledWith(expect.stringMatching(/\/actions\/stop\?sync=true$/), expect.anything())
  }
)
