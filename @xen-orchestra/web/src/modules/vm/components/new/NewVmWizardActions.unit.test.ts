import NewVmWizardActions from '@/modules/vm/components/new/NewVmWizardActions.vue'
import type { NewVmStep } from '@/modules/vm/composables/use-new-vm-wizard.composable.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import { getButton, getUiButton } from '@core-test/get-button.ts'
import { mount } from '@vue/test-utils'

function mountActions(step: NewVmStep, canCreate = true, busy = false) {
  return mount(NewVmWizardActions, { props: { step, canCreate, busy }, global: createGlobalTestConfig() })
}

function findButtonLabels(wrapper: ReturnType<typeof mountActions>) {
  return wrapper.findAll('button').map(button => button.text())
}

it('offers to cancel or continue on the environment step', () => {
  expect(findButtonLabels(mountActions('environment'))).toEqual([t('cancel'), t('action:continue')])
})

it('offers to go back or continue to the review on the configuration step, without cancelling', () => {
  expect(findButtonLabels(mountActions('configuration'))).toEqual([t('action:back'), t('action:continue-to-review')])
})

it('offers to go back or create the VM on the review step, without cancelling', () => {
  expect(findButtonLabels(mountActions('review'))).toEqual([t('action:back'), t('action:create-n-vms', 1)])
})

it('submits the form with its main button', () => {
  expect(getButton(mountActions('environment'), t('action:continue')).attributes('type')).toBe('submit')
})

it('disables the creation when the VM cannot be created', () => {
  expect(getUiButton(mountActions('review', false), t('action:create-n-vms', 1)).props('disabled')).toBe(true)
})

it('lets the user continue to the review whatever the creation state', () => {
  const wrapper = mountActions('configuration', false, true)

  expect(getUiButton(wrapper, t('action:continue-to-review')).props()).toMatchObject({ disabled: false, busy: false })
})

it('shows the creation as busy while a VM is already being created', () => {
  expect(getUiButton(mountActions('review', false, true), t('action:create-n-vms', 1)).props('busy')).toBe(true)
})

it('emits back when going back', async () => {
  const wrapper = mountActions('review')

  await getButton(wrapper, t('action:back')).trigger('click')

  expect(wrapper.emitted('back')).toHaveLength(1)
})

it('emits cancel when cancelling the environment step', async () => {
  const wrapper = mountActions('environment')

  await getButton(wrapper, t('cancel')).trigger('click')

  expect(wrapper.emitted('cancel')).toHaveLength(1)
})
