import V2vDestinationPoolCard from '@/modules/v2v/components/destination/V2vDestinationPoolCard.vue'
import V2vPoolOption from '@/modules/v2v/components/destination/V2vPoolOption.vue'
import { createPool } from '@/test/create-pool.ts'
import { createSelectBindings } from '@/test/create-select-bindings.ts'
import { findCardTitle } from '@/test/find-card-title.ts'
import { findSelectStubLabels } from '@/test/find-select-stub-labels.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import { mountWithSelect } from '@/test/mount-with-select.ts'
import { openSelect } from '@/test/select.ts'
import { useFormSelect } from '@core/packages/form-select'
import { mount } from '@vue/test-utils'
import { h } from 'vue'

const POOL_SELECT_BINDINGS = createSelectBindings('Destination pool')

function mountCard() {
  return mount(V2vDestinationPoolCard, {
    props: { poolSelectBindings: POOL_SELECT_BINDINGS },
    global: createGlobalTestConfig({ stubs: { FormSelect: true } }),
  })
}

it('shows its title and that a migration goes to one pool', () => {
  expect(findCardTitle(mountCard())).toBe(`${t('destination-pool')} ${t('v2v:destination-pool-info')}`)
})

it('lets the user choose the pool', () => {
  expect(findSelectStubLabels(mountCard())).toEqual([POOL_SELECT_BINDINGS.label])
})

it('shows each pool option with its name and resource counts', async () => {
  const pool = createPool()
  const counts = { hosts: 1, srs: 4, networks: 6 }
  const wrapper = mountWithSelect(() => {
    const { id } = useFormSelect([pool], { option: { label: 'name_label', properties: () => ({ counts }) } })

    return () => h(V2vDestinationPoolCard, { poolSelectBindings: { ...POOL_SELECT_BINDINGS, id } })
  })

  await openSelect(wrapper)

  expect(wrapper.getComponent(V2vPoolOption).props()).toEqual({ label: pool.name_label, counts })
})
