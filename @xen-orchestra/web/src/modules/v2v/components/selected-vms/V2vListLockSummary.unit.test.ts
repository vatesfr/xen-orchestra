import V2vListLockSummary from '@/modules/v2v/components/selected-vms/V2vListLockSummary.vue'
import type { V2vListLock } from '@/modules/v2v/composables/use-v2v-selected-vms.composable.ts'
import { createV2vListLock } from '@/test/create-v2v-selected-vms.ts'
import { findCardLabelledValues } from '@/test/find-labelled-values.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import { mount } from '@vue/test-utils'

const LOCKED = createV2vListLock()

function mountLockSummary(props: V2vListLock = LOCKED) {
  return mount(V2vListLockSummary, { props, global: createGlobalTestConfig() })
}

function findLockIcons(wrapper: ReturnType<typeof mountLockSummary>) {
  return wrapper.findAllComponents(VtsIcon).filter(icon => icon.props('name') === 'fa:lock')
}

it('names the source and the destination of the list', () => {
  expect(findCardLabelledValues(mountLockSummary())).toEqual({
    [t('source')]: LOCKED.sourceHost,
    [t('destination')]: LOCKED.poolName,
  })
})

it('shows the destination locked while the list holds VMs', () => {
  expect(findLockIcons(mountLockSummary())).toHaveLength(1)
})

it('shows no lock once the list is empty', () => {
  expect(findLockIcons(mountLockSummary(createV2vListLock({ isLocked: false })))).toEqual([])
})

it('leaves the values empty while unknown', () => {
  expect(findCardLabelledValues(mountLockSummary({ isLocked: false }))).toEqual({
    [t('source')]: '',
    [t('destination')]: '',
  })
})

it('explains why the source and the destination are locked', () => {
  expect(mountLockSummary().get('.note').text()).toBe(t('v2v:list-lock-info'))
})
