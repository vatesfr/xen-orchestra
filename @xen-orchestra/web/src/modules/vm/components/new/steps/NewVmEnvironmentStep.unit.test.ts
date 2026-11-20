import NewVmEnvironmentStep from '@/modules/vm/components/new/steps/NewVmEnvironmentStep.vue'
import { findAccentedInfos } from '@/test/find-accented-labels.ts'
import { findInputLabels } from '@/test/find-input-labels.ts'
import { t } from '@/test/i18n.ts'
import { xoCollectionsMock } from '@/test/mock-xo-collections.ts'
import {
  chooseNewVmTemplate,
  mountUnderNewVmForm,
  NEW_VM_DISK_TEMPLATE,
  NEW_VM_POOL,
  resetNewVmCollections,
  seedNewVmCollections,
} from '@/test/new-vm-fixtures.ts'
import { findShownSelections } from '@/test/select.ts'
import { flushPromises } from '@vue/test-utils'
import { defineComponent, h, nextTick, ref } from 'vue'

vi.mock(
  import('@/modules/pool/remote-resources/use-xo-pool-collection.ts'),
  () => import('@/test/mock-xo-collections.ts')
)

vi.mock(
  import('@/modules/host/remote-resources/use-xo-host-collection.ts'),
  () => import('@/test/mock-xo-collections.ts')
)

vi.mock(
  import('@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'),
  () => import('@/test/mock-xo-collections.ts')
)

vi.mock(
  import('@/modules/network/remote-resources/use-xo-network-collection.ts'),
  () => import('@/test/mock-xo-collections.ts')
)

vi.mock(
  import('@/modules/pif/remote-resources/use-xo-pif-collection.ts'),
  () => import('@/test/mock-xo-collections.ts')
)

vi.mock(
  import('@/modules/vm/remote-resources/use-xo-vm-template-collection.ts'),
  () => import('@/test/mock-xo-collections.ts')
)

vi.mock(
  import('@/modules/vbd/remote-resources/use-xo-vbd-collection.ts'),
  () => import('@/test/mock-xo-vm-device-collections.ts')
)

vi.mock(
  import('@/modules/vdi/remote-resources/use-xo-vdi-collection.ts'),
  () => import('@/test/mock-xo-vm-device-collections.ts')
)

vi.mock(
  import('@/modules/vdi/remote-resources/use-xo-vdi-snapshot-collection.ts'),
  () => import('@/test/mock-xo-vm-device-collections.ts')
)

vi.mock(
  import('@/modules/vif/remote-resources/use-xo-vif-collection.ts'),
  () => import('@/test/mock-xo-vm-device-collections.ts')
)

beforeEach(() => {
  resetNewVmCollections()
})

function mountStep() {
  seedNewVmCollections()

  return mountUnderNewVmForm(NewVmEnvironmentStep)
}

it('asks for the pool, then the template', () => {
  expect(findInputLabels(mountStep().wrapper)).toEqual([t('pool'), t('template')])
})

it('shows no error before the step is validated', () => {
  expect(findAccentedInfos(mountStep().wrapper)).toEqual([])
})

it('tells that the pool and the template are required once the step is validated', async () => {
  const { wrapper, form } = mountStep()

  await form.validateStep('environment')
  await nextTick()

  expect(findAccentedInfos(wrapper)).toEqual([
    { label: t('form:error:required'), accent: 'danger' },
    { label: t('form:error:required'), accent: 'danger' },
  ])
})

it('shows no error once the pool and the template are chosen', async () => {
  const { wrapper, form } = mountStep()
  await form.validateStep('environment')

  await chooseNewVmTemplate(form)

  expect(findAccentedInfos(wrapper)).toEqual([])
})

it('shows the chosen pool and template', async () => {
  const { wrapper, form } = mountStep()

  await chooseNewVmTemplate(form)
  await flushPromises()

  expect(findShownSelections(wrapper)).toEqual([NEW_VM_POOL.name_label, NEW_VM_DISK_TEMPLATE.name_label])
})

it('shows the chosen pool and template again when coming back to the step after the collections were refreshed', async () => {
  seedNewVmCollections()

  const isStepShown = ref(true)
  const { wrapper, form } = mountUnderNewVmForm(
    defineComponent({ setup: () => () => (isStepShown.value ? h(NewVmEnvironmentStep) : null) })
  )

  await chooseNewVmTemplate(form)

  xoCollectionsMock.pools.value = xoCollectionsMock.pools.value.map(pool => ({ ...pool }))
  xoCollectionsMock.templates.value = xoCollectionsMock.templates.value.map(template => ({ ...template }))
  isStepShown.value = false
  await flushPromises()
  isStepShown.value = true
  await flushPromises()

  expect(findShownSelections(wrapper)).toEqual([NEW_VM_POOL.name_label, NEW_VM_DISK_TEMPLATE.name_label])
})
