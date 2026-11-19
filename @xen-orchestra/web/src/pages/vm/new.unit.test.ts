import { useNewVmForm } from '@/modules/vm/form/new/use-new-vm-form.ts'
import type { useXoVmCreateJob } from '@/modules/vm/jobs/xo-vm-create.job.ts'
import NewVmPage from '@/pages/vm/new.vue'
import { createJobResult } from '@/test/create-job-result.ts'
import { findShownComponents } from '@/test/find-shown-components.ts'
import { getButton } from '@/test/get-button.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import { discardChangesModalMock } from '@/test/mock-discard-changes-modal.ts'
import { chooseNewVmTemplate, resetNewVmCollections, seedNewVmCollections } from '@/test/new-vm-fixtures.ts'
import VtsOperationErrorCard from '@core/components/operation-error-card/VtsOperationErrorCard.vue'
import VtsOperationPendingCard from '@core/components/operation-pending-card/VtsOperationPendingCard.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiStepper from '@core/components/ui/stepper/UiStepper.vue'
import { flushPromises, mount } from '@vue/test-utils'
import { defineComponent } from 'vue'

const { useXoVmCreateJobMock } = vi.hoisted(() => ({
  useXoVmCreateJobMock: vi.fn(),
}))

vi.mock(import('@/modules/vm/jobs/xo-vm-create.job.ts'), () => ({
  useXoVmCreateJob: useXoVmCreateJobMock as unknown as typeof useXoVmCreateJob,
}))

vi.mock(
  import('@core/composables/modals/use-discard-changes-modal.ts'),
  () => import('@/test/mock-discard-changes-modal.ts')
)

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

// Stands for a step, and reads the form the page provides to its steps
const createStepStub = () => defineComponent({ setup: () => ({ form: useNewVmForm() }), render: () => null })

const EnvironmentStep = createStepStub()
const ConfigurationStep = createStepStub()
const ReviewStep = createStepStub()

const STEPS = [EnvironmentStep, ConfigurationStep, ReviewStep]

beforeEach(() => {
  resetNewVmCollections()
  useXoVmCreateJobMock.mockReset()
  discardChangesModalMock.reset()
})

function mountPage(job: Parameters<typeof createJobResult>[1] & { run?: () => Promise<unknown> } = {}) {
  seedNewVmCollections()
  useXoVmCreateJobMock.mockReturnValue(createJobResult(job.run ?? (() => new Promise(() => {})), job))

  return mount(NewVmPage, {
    attachTo: document.body,
    global: createGlobalTestConfig({
      stubs: {
        NewVmEnvironmentStep: EnvironmentStep,
        NewVmConfigurationStep: ConfigurationStep,
        NewVmReviewStep: ReviewStep,
      },
    }),
  })
}

async function submit(wrapper: ReturnType<typeof mountPage>) {
  await wrapper.get('form').trigger('submit')
  await flushPromises()
}

// The form stays mounted, hidden by `v-show`, so that it is found as it was left
function isFormHidden(wrapper: ReturnType<typeof mountPage>) {
  const formCard = wrapper.findAllComponents(UiCard).find(card => card.find('form').exists())

  return formCard?.attributes('style')?.includes('display: none') ?? false
}

async function mountPageOnReview(job: Parameters<typeof mountPage>[0] = {}) {
  const wrapper = mountPage(job)

  await chooseNewVmTemplate(wrapper.getComponent(EnvironmentStep).vm.form)
  await submit(wrapper)
  await submit(wrapper)

  return wrapper
}

it('opens on the environment step, the first of the stepper', () => {
  const wrapper = mountPage()

  expect(findShownComponents(wrapper, STEPS)).toEqual([EnvironmentStep])
  expect(wrapper.getComponent(UiStepper).props('currentStep')).toBe(0)
})

it('stays on the environment step when submitted without a pool and a template', async () => {
  const wrapper = mountPage()

  await submit(wrapper)

  expect(findShownComponents(wrapper, STEPS)).toEqual([EnvironmentStep])
})

it('shows the configuration step once the environment is submitted', async () => {
  const wrapper = mountPage()
  await chooseNewVmTemplate(wrapper.getComponent(EnvironmentStep).vm.form)

  await submit(wrapper)

  expect(findShownComponents(wrapper, STEPS)).toEqual([ConfigurationStep])
  expect(wrapper.getComponent(UiStepper).props('currentStep')).toBe(1)
})

it('shows the review step once the configuration is submitted', async () => {
  const wrapper = await mountPageOnReview()

  expect(findShownComponents(wrapper, STEPS)).toEqual([ReviewStep])
  expect(wrapper.getComponent(UiStepper).props('currentStep')).toBe(2)
})

it('moves the keyboard focus from the submit button to the stepper when the step changes', async () => {
  const wrapper = mountPage()
  await chooseNewVmTemplate(wrapper.getComponent(EnvironmentStep).vm.form)
  const submitButton = getButton(wrapper, t('action:continue')).element
  submitButton.focus()

  await submit(wrapper)

  expect(document.activeElement).not.toBe(document.body)
  expect(document.activeElement?.contains(wrapper.getComponent(UiStepper).element)).toBe(true)
  expect(document.activeElement?.contains(submitButton)).toBe(false)
})

it('returns to the previous step when going back', async () => {
  const wrapper = await mountPageOnReview()

  await getButton(wrapper, t('action:back')).trigger('click')

  expect(findShownComponents(wrapper, STEPS)).toEqual([ConfigurationStep])
})

it('shows that the VM is being provisioned while it is created', async () => {
  const wrapper = await mountPageOnReview()

  await submit(wrapper)

  expect(wrapper.getComponent(VtsOperationPendingCard).props('title')).toBe(t('new-vm:provisioning-n-vms', 1))
  expect(wrapper.findComponent(VtsOperationErrorCard).exists()).toBe(false)
  expect(isFormHidden(wrapper)).toBe(true)
})

it('keeps the form while a creation started from another visit of the page is running', () => {
  const wrapper = mountPage({ isRunning: true, canRun: false })

  expect(wrapper.findComponent(VtsOperationPendingCard).exists()).toBe(false)
  expect(findShownComponents(wrapper, STEPS)).toEqual([EnvironmentStep])
})

it('shows why the creation failed when the review is submitted and the VM cannot be created', async () => {
  const error = new Error('Not enough memory')
  const wrapper = await mountPageOnReview({ run: () => Promise.resolve([{ status: 'rejected', reason: error }]) })

  await submit(wrapper)

  expect(wrapper.getComponent(VtsOperationErrorCard).props()).toMatchObject({
    title: t('unable-to-provision-new-vm'),
    error,
  })
  expect(isFormHidden(wrapper)).toBe(true)
})

it('shows the review again once the failure is dismissed', async () => {
  const wrapper = await mountPageOnReview({
    run: () => Promise.resolve([{ status: 'rejected', reason: new Error('Not enough memory') }]),
  })
  await submit(wrapper)

  await getButton(wrapper, t('action:go-back')).trigger('click')

  expect(wrapper.findComponent(VtsOperationErrorCard).exists()).toBe(false)
  expect(findShownComponents(wrapper, STEPS)).toEqual([ReviewStep])
  expect(isFormHidden(wrapper)).toBe(false)
})
