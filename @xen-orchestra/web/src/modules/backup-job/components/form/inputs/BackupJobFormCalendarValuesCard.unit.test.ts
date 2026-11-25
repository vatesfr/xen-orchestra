import BackupJobFormCalendarValuesCard from '@/modules/backup-job/components/form/inputs/BackupJobFormCalendarValuesCard.vue'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import type { InputWrapperMessage } from '@core/components/input-wrapper/VtsInputWrapper.vue'
import { mount, type VueWrapper } from '@vue/test-utils'

const WEEK_DAY_OPTIONS = [
  { label: 'Mon', value: 1 },
  { label: 'Tue', value: 2 },
  { label: 'Wed', value: 3 },
]

function mountValuesCard(modelValue: number[], error?: InputWrapperMessage) {
  return mount(BackupJobFormCalendarValuesCard, {
    props: { label: 'Days of the week', options: WEEK_DAY_OPTIONS, columns: 7, modelValue, error },
    global: createGlobalTestConfig(),
  })
}

function getValueButton(wrapper: VueWrapper, label: string) {
  const button = wrapper.findAll('.schedule-cron-value-button').find(button => button.text() === label)

  if (button === undefined) {
    throw new Error(`No value "${label}"`)
  }

  return button
}

it('shows its title', () => {
  expect(mountValuesCard([]).text()).toContain('Days of the week')
})

it('highlights the selected values', () => {
  const wrapper = mountValuesCard([1, 3])

  expect(wrapper.findAll('.schedule-cron-value-button.selected').map(button => button.text())).toEqual(['Mon', 'Wed'])
})

it('adds a value to the selection, keeping it sorted', async () => {
  const wrapper = mountValuesCard([3])

  await getValueButton(wrapper, 'Mon').trigger('click')

  expect(wrapper.emitted('update:modelValue')).toEqual([[[1, 3]]])
})

it('removes a value from the selection', async () => {
  const wrapper = mountValuesCard([1, 3])

  await getValueButton(wrapper, 'Wed').trigger('click')

  expect(wrapper.emitted('update:modelValue')).toEqual([[[1]]])
})

it('shows no error by default', () => {
  const wrapper = mountValuesCard([])

  expect(wrapper.find('.ui-info').exists()).toBe(false)
  expect(wrapper.find('.schedule-values-card.error').exists()).toBe(false)
})

it('shows the error, and highlights the card', () => {
  const wrapper = mountValuesCard([], { content: 'Select at least one day.', accent: 'danger' })

  expect(wrapper.get('.ui-info').text()).toBe('Select at least one day.')
  expect(wrapper.find('.schedule-values-card.error').exists()).toBe(true)
})
