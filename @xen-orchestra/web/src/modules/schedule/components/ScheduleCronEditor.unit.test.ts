import ScheduleCronCard from '@/modules/schedule/components/ScheduleCronCard.vue'
import ScheduleCronEditor from '@/modules/schedule/components/ScheduleCronEditor.vue'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import { mount, type VueWrapper } from '@vue/test-utils'

function mountCronEditor(cron: string) {
  const wrapper = mount(ScheduleCronEditor, {
    props: {
      modelValue: cron,
      timezone: 'Europe/Paris',
      'onUpdate:modelValue': (value: string) => wrapper.setProps({ modelValue: value }),
    },
    global: createGlobalTestConfig(),
  })

  return wrapper
}

function findCardTitles(wrapper: VueWrapper) {
  return wrapper.findAllComponents(ScheduleCronCard).map(card => card.props('title'))
}

function getCard(wrapper: VueWrapper, title: string) {
  const card = wrapper.findAllComponents(ScheduleCronCard).find(card => card.props('title') === title)

  if (card === undefined) {
    throw new Error(`No card "${title}"`)
  }

  return card
}

function getDayCardOptionCount(wrapper: VueWrapper) {
  return getCard(wrapper, t('day')).findAll('.schedule-cron-value-button').length
}

async function toggleWeekDayMode(wrapper: VueWrapper) {
  await getCard(wrapper, t('day'))
    .get('.ui-toggle input')
    .setValue(!getCard(wrapper, t('day')).get<HTMLInputElement>('.ui-toggle input').element.checked)
}

it('edits the month, the day, the hour and the minute', () => {
  expect(findCardTitles(mountCronEditor('0 0 * * *'))).toEqual([t('month'), t('day'), t('hour'), t('minute')])
})

it('shows the resulting expression', () => {
  const wrapper = mountCronEditor('30 2 * * 1')

  expect(wrapper.get<HTMLInputElement>('.expression input').element.value).toBe('30 2 * * 1')
})

it('selects the days of the week when no day of the month is selected', () => {
  expect(getDayCardOptionCount(mountCronEditor('0 0 * * *'))).toBe(7)
})

it('selects the days of the month when some are selected', () => {
  expect(getDayCardOptionCount(mountCronEditor('0 0 1,15 * *'))).toBe(31)
})

it('selects every day again when switching between the days of the week and of the month', async () => {
  const wrapper = mountCronEditor('0 0 * * 1')

  await toggleWeekDayMode(wrapper)

  expect(wrapper.emitted('update:modelValue')).toEqual([['0 0 * * *']])
  expect(getDayCardOptionCount(wrapper)).toBe(31)
})

it('adds a toggled hour to the expression', async () => {
  const wrapper = mountCronEditor('0 0 * * *')

  const hourButton = getCard(wrapper, t('hour'))
    .findAll('.schedule-cron-value-button')
    .find(button => button.text() === '06')

  await hourButton!.trigger('click')

  expect(wrapper.emitted('update:modelValue')).toEqual([['0 0,6 * * *']])
})

it('runs at the given interval of hours', async () => {
  const wrapper = mountCronEditor('0 0 * * *')

  await getCard(wrapper, t('hour')).get('.schedule-step-input input').setValue('6')

  expect(wrapper.emitted('update:modelValue')).toEqual([['0 */6 * * *']])
})
