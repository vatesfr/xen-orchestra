import V2vWizardStepActions from '@/modules/v2v/components/wizard/V2vWizardStepActions.vue'
import { getButton } from '@/test/get-button.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import UiButton from '@core/components/ui/button/UiButton.vue'
import { mount } from '@vue/test-utils'
import { h } from 'vue'

const NEXT_LABEL = 'next step'

function mountActions() {
  return mount(V2vWizardStepActions, {
    slots: { default: () => h(UiButton, { accent: 'brand', variant: 'primary', size: 'medium' }, () => NEXT_LABEL) },
    global: createGlobalTestConfig(),
  })
}

it('offers to go back, then the action of the step', () => {
  const wrapper = mountActions()

  expect(wrapper.findAllComponents(UiButton).map(button => button.text())).toEqual([t('action:back'), NEXT_LABEL])
})

it('goes back', async () => {
  const wrapper = mountActions()

  await getButton(wrapper, t('action:back')).trigger('click')

  expect(wrapper.emitted('back')).toEqual([[]])
})
