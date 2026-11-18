import VmMigrateButton from '@/modules/vm/components/actions/migrate/VmMigrateButton.vue'
import type { useVmMigrate } from '@/modules/vm/composables/use-vm-migrate.composable.ts'
import { createVm } from '@/test/create-vm.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import { mockModule } from '@/test/spy-on-module.ts'
import UiButton from '@core/components/ui/button/UiButton.vue'
import { IK_HIDE_ACTION_BUTTON_BUSY, IK_IN_MENU } from '@core/utils/injection-keys.util.ts'
import { mount } from '@vue/test-utils'
import { ref } from 'vue'

const { migrateVm } = vi.hoisted(() => ({
  migrateVm: vi.fn(),
}))

const canMigrateVm = ref(true)
const isMigratingVm = ref(false)
const isMigrationBlocked = ref(false)
const migrateVmErrorMessage = ref<string | undefined>(undefined)

mockModule(import('@/modules/vm/composables/use-vm-migrate.composable.ts'), () => ({
  useVmMigrate: (() => ({
    migrateVm,
    canMigrateVm,
    isMigratingVm,
    isMigrationBlocked,
    migrateVmErrorMessage,
  })) as unknown as typeof useVmMigrate,
}))

beforeEach(() => {
  migrateVm.mockReset()

  canMigrateVm.value = true
  isMigratingVm.value = false
  isMigrationBlocked.value = false
  migrateVmErrorMessage.value = undefined
})

function mountButton({ isInMenu = true, isBusyHidden = false } = {}) {
  return mount(VmMigrateButton, {
    props: { vm: createVm() },
    global: {
      ...createGlobalTestConfig(),
      provide: { [IK_IN_MENU as symbol]: isInMenu, [IK_HIDE_ACTION_BUTTON_BUSY as symbol]: isBusyHidden },
    },
  })
}

function findTrigger(wrapper: ReturnType<typeof mountButton>) {
  return wrapper.get('.menu-trigger')
}

it('opens the migration when the VM can be migrated', async () => {
  const wrapper = mountButton()

  await findTrigger(wrapper).trigger('click')

  expect(findTrigger(wrapper).classes('disabled')).toBe(false)
  expect(wrapper.find('.em-dash-prefix').exists()).toBe(false)
  expect(migrateVm).toHaveBeenCalledOnce()
})

it('is disabled with the reason when the VM cannot be migrated', async () => {
  canMigrateVm.value = false
  migrateVmErrorMessage.value = t('job:vm-migrate:paused')

  const wrapper = mountButton()

  await findTrigger(wrapper).trigger('click')

  expect(findTrigger(wrapper).classes('disabled')).toBe(true)
  expect(wrapper.get('.em-dash-prefix').text()).toBe(t('job:vm-migrate:paused'))
  expect(migrateVm).not.toHaveBeenCalled()
})

it('stays enabled when the migration is blocked, so the blocked modal can open', async () => {
  canMigrateVm.value = false
  isMigrationBlocked.value = true
  migrateVmErrorMessage.value = t('job:vm-migrate:blocked-operation')

  const wrapper = mountButton()

  await findTrigger(wrapper).trigger('click')

  expect(findTrigger(wrapper).classes('disabled')).toBe(false)
  expect(wrapper.find('.em-dash-prefix').exists()).toBe(false)
  expect(migrateVm).toHaveBeenCalledOnce()
})

it('is busy, not disabled, while the VM is being migrated', async () => {
  canMigrateVm.value = false
  isMigratingVm.value = true
  migrateVmErrorMessage.value = t('job:vm-migrate:in-progress')

  const wrapper = mountButton()

  await findTrigger(wrapper).trigger('click')

  expect(findTrigger(wrapper).classes('disabled')).toBe(false)
  expect(findTrigger(wrapper).classes('active')).toBe(true)
  expect(wrapper.find('.em-dash-prefix').exists()).toBe(false)
  expect(migrateVm).not.toHaveBeenCalled()
})

describe('outside of a menu', () => {
  it('is a button opening the migration', async () => {
    const wrapper = mountButton({ isInMenu: false })

    await wrapper.getComponent(UiButton).trigger('click')

    expect(wrapper.find('.menu-trigger').exists()).toBe(false)
    expect(wrapper.getComponent(UiButton).text()).toBe(t('action:migrate'))
    expect(migrateVm).toHaveBeenCalledOnce()
  })

  it('is disabled with the reason as a tooltip when the VM cannot be migrated', () => {
    canMigrateVm.value = false
    migrateVmErrorMessage.value = t('job:vm-migrate:paused')

    const wrapper = mountButton({ isInMenu: false })

    expect(wrapper.getComponent(UiButton).props('disabled')).toBe(true)
    expect(wrapper.find('.em-dash-prefix').exists()).toBe(false)
  })

  it('is disabled without a loader while the VM is being migrated, when the loader is hidden', () => {
    isMigratingVm.value = true

    const wrapper = mountButton({ isInMenu: false, isBusyHidden: true })

    expect(wrapper.getComponent(UiButton).props('busy')).toBe(false)
    expect(wrapper.getComponent(UiButton).props('disabled')).toBe(true)
  })
})
