import type { FrontXoHost } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import { usePoolExistingHostForm } from '@/modules/pool/form/use-pool-existing-host-form.ts'
import type { FrontXoPool } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import FormSelect from '@/shared/components/form/FormSelect.vue'
import { createHost } from '@/test/create-host.ts'
import { xoCollectionsMock } from '@/test/mock-xo-collections.ts'
import { mountWithSelect } from '@/test/mount-with-select.ts'
import { findSelectOptionLabels, openSelect, pickSelectOption } from '@/test/select.ts'
import { h } from 'vue'

vi.mock(
  import('@/modules/host/remote-resources/use-xo-host-collection.ts'),
  () => import('@/test/mock-xo-collections.ts')
)

beforeEach(() => {
  xoCollectionsMock.reset()
})

const POOL_ID = 'pool-1' as FrontXoPool['id']

const poolHost = createHost({ id: 'pool-host' as FrontXoHost['id'], name_label: 'Pool host', $pool: POOL_ID })

const standaloneHost = createHost({
  id: 'standalone-host' as FrontXoHost['id'],
  name_label: 'Standalone host',
  $pool: 'pool-2' as FrontXoPool['id'],
})

const firstClusteredHost = createHost({
  id: 'clustered-host-1' as FrontXoHost['id'],
  name_label: 'Clustered host 1',
  $pool: 'pool-3' as FrontXoPool['id'],
})

const secondClusteredHost = createHost({
  id: 'clustered-host-2' as FrontXoHost['id'],
  name_label: 'Clustered host 2',
  $pool: 'pool-3' as FrontXoPool['id'],
})

function mountPoolExistingHostForm() {
  let form!: ReturnType<typeof usePoolExistingHostForm>

  const wrapper = mountWithSelect(() => {
    form = usePoolExistingHostForm(POOL_ID)

    return () => h(FormSelect, form.hostSelectBindings.value)
  })

  return { wrapper, form }
}

describe('host options', () => {
  it('only offers the hosts alone in another pool', async () => {
    xoCollectionsMock.hosts.value = [poolHost, standaloneHost, firstClusteredHost, secondClusteredHost]
    const { wrapper } = mountPoolExistingHostForm()

    await openSelect(wrapper)

    expect(findSelectOptionLabels(wrapper)).toEqual([standaloneHost.name_label])
  })
})

describe('validateAndGetHostId', () => {
  it('rejects a form without host', async () => {
    const { form } = mountPoolExistingHostForm()

    expect(await form.validateAndGetHostId()).toBeUndefined()
  })

  it('returns the picked host', async () => {
    xoCollectionsMock.hosts.value = [standaloneHost]
    const { wrapper, form } = mountPoolExistingHostForm()

    await openSelect(wrapper)
    await pickSelectOption(wrapper, standaloneHost.name_label)

    expect(await form.validateAndGetHostId()).toBe(standaloneHost.id)
  })
})
