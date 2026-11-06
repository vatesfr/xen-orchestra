import V2vLaunchGroupVm from '@/modules/v2v/components/review/V2vLaunchGroupVm.vue'
import V2vMigratedVmItem from '@/modules/v2v/components/review/V2vMigratedVmItem.vue'
import type { V2vMigratedVm } from '@/modules/v2v/composables/use-v2v-review-step.composable.ts'
import FormCheckbox from '@/shared/components/form/FormCheckbox.vue'
import { createV2vMigratedVm } from '@/test/create-v2v-launch.ts'
import { getCheckbox } from '@/test/get-checkbox.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import UiLink from '@core/components/ui/link/UiLink.vue'
import { mount } from '@vue/test-utils'

const DESTINATION_POOL_NAME = 'diskor'

function mountItem(vm: V2vMigratedVm = createV2vMigratedVm()) {
  return mount(V2vMigratedVmItem, {
    props: { vm, destinationPoolName: DESTINATION_POOL_NAME },
    global: createGlobalTestConfig(),
  })
}

function getDetails(vm: V2vMigratedVm) {
  return t('v2v:migrated-vm-details', {
    vm: vm.importVm.name,
    pool: vm.poolName,
    srs: vm.srs,
    destinationPool: DESTINATION_POOL_NAME,
  })
}

function getSecondCopyLabel(vm: V2vMigratedVm) {
  return t('v2v:create-second-copy', { name: vm.name })
}

// The VM name, then what the sentence tells of it
function findVmText(wrapper: ReturnType<typeof mountItem>) {
  return wrapper.getComponent(V2vLaunchGroupVm).text()
}

it('names the VM, then tells when it was cut over, where it is and that a second VM will be created', () => {
  const vm = createV2vMigratedVm()

  expect(findVmText(mountItem(vm))).toBe(`${vm.name}${vm.cutover}${getDetails(vm)}`)
})

it('tells where the VM is without its cutover date once unknown', () => {
  const vm = createV2vMigratedVm({ cutover: undefined })

  expect(findVmText(mountItem(vm))).toBe(`${vm.name}${getDetails(vm)}`)
})

it('links to the dashboard of the existing VM', () => {
  const vm = createV2vMigratedVm()

  expect(mountItem(vm).getComponent(UiLink).props('to')).toEqual({
    name: '/vm/[id]/dashboard',
    params: { id: vm.importVm.id },
  })
})

it.each([false, true])('offers a second copy of the VM, confirmed: %s', isConfirmed => {
  const vm = createV2vMigratedVm({ isConfirmed })

  expect(mountItem(vm).getComponent(FormCheckbox).props()).toMatchObject({
    label: getSecondCopyLabel(vm),
    modelValue: isConfirmed,
  })
})

it.each([true, false])('confirms the second copy once set to %s', async isConfirmed => {
  const vm = createV2vMigratedVm({ isConfirmed: !isConfirmed })
  const wrapper = mountItem(vm)

  await getCheckbox(wrapper, getSecondCopyLabel(vm)).setValue(isConfirmed)

  expect(wrapper.emitted('confirm')).toEqual([[isConfirmed]])
})
