import V2vWizardHeader from '@/modules/v2v/components/wizard/V2vWizardHeader.vue'
import type { V2vWizardStep } from '@/modules/v2v/utils/v2v-wizard-step.util.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import UiNumberedStepper from '@core/components/ui/numbered-stepper/UiNumberedStepper.vue'
import { mount } from '@vue/test-utils'

function mountHeader(currentStep: V2vWizardStep, summary?: string) {
  return mount(V2vWizardHeader, { props: { currentStep, summary }, global: createGlobalTestConfig() })
}

it('shows the wizard title and its summary', () => {
  const wrapper = mountHeader('source', 'vcenter-prod.lab')

  expect(wrapper.get('.ui-head-bar').text()).toContain(t('migrate-vms'))
  expect(wrapper.get('.summary').text()).toBe('vcenter-prod.lab')
})

it('shows no summary when there is none', () => {
  expect(mountHeader('source').find('.summary').exists()).toBe(false)
})

it('lists the steps of the wizard in order', () => {
  expect(mountHeader('source').getComponent(UiNumberedStepper).props('steps')).toEqual([
    { label: t('source') },
    { label: t('destination') },
    { label: t('vms') },
    { label: t('mapping') },
    { label: t('review') },
  ])
})

it.each([
  ['source', 0],
  ['destination', 1],
  ['review', 4],
] as const)('highlights the %s step', (step, index) => {
  expect(mountHeader(step).getComponent(UiNumberedStepper).props('currentStep')).toBe(index)
})
