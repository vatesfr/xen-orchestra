import BackupJobFormCalendarIntervalCard from '@/modules/backup-job/components/form/inputs/BackupJobFormCalendarIntervalCard.vue'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { mount } from '@vue/test-utils'

const HOUR_OPTIONS = Array.from({ length: 24 }, (_, hour) => ({ label: String(hour), value: hour }))

function mountIntervalCard(modelValue: number[]) {
  return mount(BackupJobFormCalendarIntervalCard, {
    props: { options: HOUR_OPTIONS, unit: 'hours', modelValue },
    global: createGlobalTestConfig(),
  })
}

function getStepInput(wrapper: ReturnType<typeof mountIntervalCard>) {
  return wrapper.get<HTMLInputElement>('input')
}

it('shows the step of values selected at a regular interval', () => {
  expect(getStepInput(mountIntervalCard([0, 6, 12, 18])).element.value).toBe('6')
})

it('shows no step for values not selected at a regular interval', () => {
  expect(getStepInput(mountIntervalCard([1, 2])).element.value).toBe('')
})

it('selects the values at the given interval', async () => {
  const wrapper = mountIntervalCard([])

  await getStepInput(wrapper).setValue('8')

  expect(wrapper.emitted('update:modelValue')).toEqual([[[0, 8, 16]]])
})

it('caps the interval to half of the values', async () => {
  const wrapper = mountIntervalCard([])

  await getStepInput(wrapper).setValue('20')

  expect(wrapper.emitted('update:modelValue')).toEqual([[[0, 12]]])
})
