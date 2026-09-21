import StorageRepositorySpace from '@/modules/storage-repository/components/general/StorageRepositorySpace.vue'
import type { FrontXoSr } from '@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'
import { ONE_GB } from '@/shared/constants.ts'
import { createSr } from '@/test/create-sr.ts'
import { findLabelledValues, findLegends } from '@/test/find-labelled-values.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import { mount } from '@vue/test-utils'

function mountSpace(overrides: Partial<FrontXoSr> = {}) {
  return mount(StorageRepositorySpace, {
    props: { sr: createSr({ size: 10 * ONE_GB, physical_usage: ONE_GB, usage: ONE_GB, ...overrides }) },
    global: createGlobalTestConfig(),
  })
}

type SpaceWrapper = ReturnType<typeof mountSpace>

function findUsageAlert(wrapper: SpaceWrapper) {
  const alert = wrapper.find('.sr-usage-exceeded-alert')

  return alert.exists() ? { text: alert.text(), isDanger: alert.classes('accent--danger') } : undefined
}

it('breaks down the space of the SR', () => {
  const wrapper = mountSpace()

  expect(findLabelledValues(wrapper)).toEqual({
    [t('vdis-allocated-space')]: '1 GiB',
    [t('used-space-on-sr')]: '1 GiB',
    [t('free-space-on-sr')]: '9 GiB',
    [t('total-space-on-sr')]: '10 GiB',
  })
})

it('shows how full the SR is, under its own name', () => {
  const wrapper = mountSpace({ name_label: 'Local storage', physical_usage: 2 * ONE_GB })

  expect(findLegends(wrapper)).toEqual([['Local storage', '20%']])
})

it('leaves the SR unflagged while it is used under 80%', () => {
  const wrapper = mountSpace({ physical_usage: 8 * ONE_GB })

  expect(findUsageAlert(wrapper)).toBeUndefined()
})

it('warns when the SR is used over 80%', () => {
  const wrapper = mountSpace({ physical_usage: 8.5 * ONE_GB })

  expect(findUsageAlert(wrapper)).toEqual({ text: t('sr-usage-exceeds-80-percent'), isDanger: false })
})

it('raises the alert when the SR is used over 90%', () => {
  const wrapper = mountSpace({ physical_usage: 9.5 * ONE_GB })

  expect(findUsageAlert(wrapper)).toEqual({ text: t('sr-usage-exceeds-90-percent'), isDanger: true })
})

it('says an ISO SR cannot be written to', () => {
  const wrapper = mountSpace({ content_type: 'iso' })

  expect(wrapper.get('.sr-unwritable-alert').text()).toBe(t('sr-is-unwritable'))
})

it('says nothing about writability on a regular SR', () => {
  const wrapper = mountSpace()

  expect(wrapper.find('.sr-unwritable-alert').exists()).toBe(false)
})

it('leaves a full unwritable SR unflagged rather than alerting on its usage', () => {
  const wrapper = mountSpace({ content_type: 'iso', physical_usage: 10 * ONE_GB })

  expect(findUsageAlert(wrapper)).toBeUndefined()
})

it('warns when the VDIs claim more space than the SR holds', () => {
  const wrapper = mountSpace({ usage: 11 * ONE_GB })

  expect(wrapper.get('.vdi-allocated-space-warning').text()).toBe(t('vdi-allocated-space-exceeds-sr'))
})

it('does not warn while the VDIs fit in the SR', () => {
  const wrapper = mountSpace({ usage: 10 * ONE_GB })

  expect(wrapper.find('.vdi-allocated-space-warning').exists()).toBe(false)
})

it('does not warn about the VDIs of an unwritable SR', () => {
  const wrapper = mountSpace({ content_type: 'iso', usage: 11 * ONE_GB })

  expect(wrapper.find('.vdi-allocated-space-warning').exists()).toBe(false)
})
