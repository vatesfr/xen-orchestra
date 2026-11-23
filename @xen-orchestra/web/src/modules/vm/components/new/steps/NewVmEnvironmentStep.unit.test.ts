import NewVmEnvironmentStep from '@/modules/vm/components/new/steps/NewVmEnvironmentStep.vue'
import { findInputLabels } from '@/test/find-input-labels.ts'
import { t } from '@/test/i18n.ts'
import { xoCollectionsMock } from '@/test/mock-xo-collections.ts'
import {
  chooseNewVmTemplate,
  mockNewVmCollections,
  mountUnderNewVmForm,
  NEW_VM_DISK_TEMPLATE,
  NEW_VM_POOL,
  resetNewVmCollections,
  seedNewVmCollections,
} from '@/test/new-vm-fixtures.ts'
import { findShownSelections } from '@/test/select.ts'
import { findAccentedInfos } from '@core-test/find-accented-labels.ts'
import { flushPromises } from '@vue/test-utils'
import { defineComponent, h, nextTick, ref } from 'vue'

mockNewVmCollections()

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
