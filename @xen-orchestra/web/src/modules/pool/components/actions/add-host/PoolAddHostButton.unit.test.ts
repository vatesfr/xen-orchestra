import PoolAddExistingHostButton from '@/modules/pool/components/actions/add-host/PoolAddExistingHostButton.vue'
import PoolAddHostButton from '@/modules/pool/components/actions/add-host/PoolAddHostButton.vue'
import PoolAddNewHostButton from '@/modules/pool/components/actions/add-host/PoolAddNewHostButton.vue'
import { usePoolExistingHost } from '@/modules/pool/composables/use-pool-existing-host.composable.ts'
import { usePoolNewHost } from '@/modules/pool/composables/use-pool-new-host.composable.ts'
import type { FrontXoPool } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import { createJobStub, toJobComposableResult } from '@/test/create-job-result.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import MenuItem from '@core/components/menu/MenuItem.vue'
import UiDropdownButton from '@core/components/ui/dropdown-button/UiDropdownButton.vue'
import { IK_IN_MENU } from '@core/utils/injection-keys.util.ts'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'

const newHost = createJobStub(usePoolNewHost, result => toJobComposableResult(result, 'addNewHost', 'isAddingNewHost'))
const existingHost = createJobStub(usePoolExistingHost, result =>
  toJobComposableResult(result, 'addExistingHost', 'isAddingExistingHost')
)

beforeEach(() => {
  newHost.reset()
  existingHost.reset()
})

const POOL_ID = 'pool-1' as FrontXoPool['id']

function mountButton({ isInMenu = false } = {}) {
  return mount(PoolAddHostButton, {
    props: { poolId: POOL_ID },
    global: {
      ...createGlobalTestConfig(),
      provide: { [IK_IN_MENU as symbol]: isInMenu },
    },
  })
}

async function openMenu(wrapper: ReturnType<typeof mountButton>) {
  await wrapper.getComponent(UiDropdownButton).trigger('click')
  await nextTick()
}

function expectHostChoices(wrapper: ReturnType<typeof mountButton>) {
  expect(wrapper.getComponent(PoolAddNewHostButton).props('poolId')).toBe(POOL_ID)
  expect(wrapper.getComponent(PoolAddExistingHostButton).props('poolId')).toBe(POOL_ID)
}

describe('outside of a menu', () => {
  it('is a dropdown to add a host', () => {
    const wrapper = mountButton()

    expect(wrapper.getComponent(UiDropdownButton).text()).toBe(t('action:add-host'))
  })

  it('offers a new host or an existing host of the pool', async () => {
    const wrapper = mountButton()

    await openMenu(wrapper)

    expectHostChoices(wrapper)
  })
})

describe('in a menu', () => {
  it('is a menu item to add a host', () => {
    const wrapper = mountButton({ isInMenu: true })

    expect(wrapper.findComponent(UiDropdownButton).exists()).toBe(false)
    expect(wrapper.getComponent(MenuItem).text()).toBe(t('action:add-host'))
  })

  it('offers a new host or an existing host of the pool in its submenu', async () => {
    const wrapper = mountButton({ isInMenu: true })

    await wrapper.get('.menu-trigger').trigger('click')
    await nextTick()

    expectHostChoices(wrapper)
  })
})
