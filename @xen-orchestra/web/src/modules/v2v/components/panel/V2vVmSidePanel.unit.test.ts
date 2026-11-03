import V2vNewVmActions from '@/modules/v2v/components/panel/V2vNewVmActions.vue'
import V2vNewVmCards from '@/modules/v2v/components/panel/V2vNewVmCards.vue'
import V2vNotFoundVmActions from '@/modules/v2v/components/panel/V2vNotFoundVmActions.vue'
import V2vResumedVmActions from '@/modules/v2v/components/panel/V2vResumedVmActions.vue'
import V2vResumedVmCards from '@/modules/v2v/components/panel/V2vResumedVmCards.vue'
import V2vVmHeadingCard from '@/modules/v2v/components/panel/V2vVmHeadingCard.vue'
import V2vVmSidePanel from '@/modules/v2v/components/panel/V2vVmSidePanel.vue'
import type { V2vMappingStepVm } from '@/modules/v2v/composables/use-v2v-mapping-step.composable.ts'
import {
  createV2vNewMappingStepVm,
  createV2vNotFoundMappingStepVm,
  createV2vResumedMappingStepVm,
} from '@/test/create-v2v-mapping-step-vm.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import VtsSidePanel from '@core/components/panel/VtsSidePanel.vue'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import { mount, type VueWrapper } from '@vue/test-utils'

const NEW_VM = createV2vNewMappingStepVm()

const RESUMED_VM = createV2vResumedMappingStepVm()

const NOT_FOUND_VM = createV2vNotFoundMappingStepVm()

const updateVm = vi.fn()

// The actions and the cards of each kind are covered by their own tests: here only which ones the panel shows matters
function mountPanel(vm?: V2vMappingStepVm) {
  return mount(V2vVmSidePanel, {
    props: { vm, updateVm },
    global: createGlobalTestConfig({
      stubs: {
        V2vNewVmActions: true,
        V2vResumedVmActions: true,
        V2vNotFoundVmActions: true,
        V2vNewVmCards: true,
        V2vResumedVmCards: true,
        V2vVmHeadingCard: true,
      },
    }),
  })
}

const KIND_COMPONENTS = [V2vNewVmActions, V2vResumedVmActions, V2vNotFoundVmActions, V2vNewVmCards, V2vResumedVmCards]

function findKindComponents(wrapper: VueWrapper) {
  return KIND_COMPONENTS.filter(component => wrapper.findComponent(component).exists())
}

function findNotFoundHero(wrapper: VueWrapper) {
  return wrapper.findAllComponents(VtsStateHero).find(hero => hero.props('type') === 'not-found')
}

it('shows no VM without a selection', () => {
  const wrapper = mountPanel()

  expect(wrapper.getComponent(VtsSidePanel).props('hasSelection')).toBe(false)
  expect(findKindComponents(wrapper)).toEqual([])
})

it('shows no heading without a selection', () => {
  expect(mountPanel().findComponent(V2vVmHeadingCard).exists()).toBe(false)
})

it.each([
  ['a new VM', NEW_VM],
  ['a resumed VM', RESUMED_VM],
  ['a VM not found in the source', NOT_FOUND_VM],
])('heads the body of %s with its heading, first', (_, vm) => {
  const wrapper = mountPanel(vm)
  const headingCard = wrapper.getComponent(V2vVmHeadingCard)

  expect(headingCard.props()).toEqual({ id: vm.id, heading: vm.heading })
  expect(wrapper.get('.ui-panel > .content').element.firstElementChild).toBe(headingCard.element)
})

it('closes on request', async () => {
  const wrapper = mountPanel(NEW_VM)

  await wrapper.getComponent(VtsSidePanel).vm.$emit('close')

  expect(wrapper.emitted('close')).toEqual([[]])
})

describe('new VM', () => {
  it('heads the panel with the actions of a new VM, stored through the list', () => {
    expect(mountPanel(NEW_VM).getComponent(V2vNewVmActions).props()).toEqual({ vm: NEW_VM, updateVm })
  })

  it('shows the mapping of the VM', () => {
    const wrapper = mountPanel(NEW_VM)

    expect(wrapper.getComponent(V2vNewVmCards).props()).toEqual({ vm: NEW_VM, updateVm })
    expect(findKindComponents(wrapper)).toEqual([V2vNewVmActions, V2vNewVmCards])
  })
})

describe('resumed VM', () => {
  it('heads the panel with the actions of a resumed VM, and shows its first sync', () => {
    const wrapper = mountPanel(RESUMED_VM)

    expect([
      wrapper.getComponent(V2vResumedVmActions).props('vm'),
      wrapper.getComponent(V2vResumedVmCards).props('vm'),
    ]).toEqual([RESUMED_VM, RESUMED_VM])
    expect(findKindComponents(wrapper)).toEqual([V2vResumedVmActions, V2vResumedVmCards])
  })

  it('switches to the new VM it becomes once its import VM is deleted', async () => {
    const wrapper = mountPanel(RESUMED_VM)

    await wrapper.setProps({ vm: NEW_VM })

    expect(findKindComponents(wrapper)).toEqual([V2vNewVmActions, V2vNewVmCards])
  })
})

describe('VM not found in the source', () => {
  it('tells the VM is not found in the source, with its actions', () => {
    const wrapper = mountPanel(NOT_FOUND_VM)

    expect(findNotFoundHero(wrapper)?.text()).toBe(t('v2v:not-found-in-source'))
    expect(wrapper.getComponent(V2vNotFoundVmActions).props('vm')).toEqual(NOT_FOUND_VM)
    expect(findKindComponents(wrapper)).toEqual([V2vNotFoundVmActions])
  })

  it('has no not-found hero for a VM of the source', () => {
    expect(findNotFoundHero(mountPanel(NEW_VM))).toBeUndefined()
  })
})

it.each([
  ['a new VM', NEW_VM, V2vNewVmActions],
  ['a VM not found in the source', NOT_FOUND_VM, V2vNotFoundVmActions],
] as const)('emits the removal of %s', async (_, vm, actionsComponent) => {
  const wrapper = mountPanel(vm)

  await wrapper.getComponent(actionsComponent).vm.$emit('remove', vm.id)

  expect(wrapper.emitted('remove')).toEqual([[vm.id]])
})
