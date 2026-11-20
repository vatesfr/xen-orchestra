import NewVmReviewRow from '@/modules/vm/components/new/review/NewVmReviewRow.vue'
import { findOverriddenLabels } from '@/test/find-overridden-labels.ts'
import { findLabelledValues } from '@/test/find-rendered-values.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import { mount } from '@vue/test-utils'

function mountRow(props: { value?: string | number; overridden?: boolean }, slot?: string) {
  return mount(NewVmReviewRow, {
    props: { label: 'vCPUs', ...props },
    slots: slot === undefined ? {} : { default: slot },
    global: createGlobalTestConfig(),
  })
}

it('shows the value under its label', () => {
  expect(findLabelledValues(mountRow({ value: 4 }))).toEqual({ vCPUs: '4' })
})

it('shows its slot in place of the value', () => {
  expect(findLabelledValues(mountRow({ value: 4 }, 'Four'))).toEqual({ vCPUs: 'Four' })
})

it('leaves the value empty without one', () => {
  expect(findLabelledValues(mountRow({ value: '' }))).toEqual({ vCPUs: '' })
})

it('marks an overridden value', () => {
  expect(findOverriddenLabels(mountRow({ value: 4, overridden: true }))).toEqual([t('overridden')])
})

it('shows no marker for a value left as is', () => {
  expect(findOverriddenLabels(mountRow({ value: 4 }))).toEqual([])
})
