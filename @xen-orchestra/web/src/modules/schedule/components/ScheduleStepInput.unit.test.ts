import ScheduleStepInput from '@/modules/schedule/components/ScheduleStepInput.vue'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import { mount } from '@vue/test-utils'

function mountStepInput(step: number | undefined) {
  return mount(ScheduleStepInput, {
    props: { step, maxStep: 12, unit: 'hours' },
    global: createGlobalTestConfig(),
  })
}

it('reads every given step of the unit', () => {
  const wrapper = mountStepInput(2)

  expect(wrapper.text()).toBe(`${t('every')}hours`)
  expect(wrapper.get<HTMLInputElement>('input').element.value).toBe('2')
})

it('is empty without step', () => {
  expect(mountStepInput(undefined).get<HTMLInputElement>('input').element.value).toBe('')
})

it('updates the step', async () => {
  const wrapper = mountStepInput(2)

  await wrapper.get('input').setValue('6')

  expect(wrapper.emitted('update:step')).toEqual([[6]])
})

it('caps the step to the maximum step', async () => {
  const wrapper = mountStepInput(2)

  await wrapper.get('input').setValue('20')

  expect(wrapper.emitted('update:step')).toEqual([[12]])
})

it.each(['0', '-1', '1.5', ''])('ignores the step %s', async step => {
  const wrapper = mountStepInput(2)

  await wrapper.get('input').setValue(step)

  expect(wrapper.emitted('update:step')).toBeUndefined()
})
