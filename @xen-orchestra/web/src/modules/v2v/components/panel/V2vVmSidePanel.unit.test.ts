import V2vNewVmCards from '@/modules/v2v/components/panel/V2vNewVmCards.vue'
import V2vResumedVmCards from '@/modules/v2v/components/panel/V2vResumedVmCards.vue'
import V2vVmActions from '@/modules/v2v/components/panel/V2vVmActions.vue'
import V2vVmHeadingCard from '@/modules/v2v/components/panel/V2vVmHeadingCard.vue'
import V2vVmKindActions from '@/modules/v2v/components/panel/V2vVmKindActions.vue'
import V2vVmSidePanel from '@/modules/v2v/components/panel/V2vVmSidePanel.vue'
import type { V2vMappingStepVm } from '@/modules/v2v/composables/use-v2v-mapping-step.composable.ts'
import {
  createV2vNewMappingStepVm,
  createV2vNotFoundMappingStepVm,
  createV2vResumedMappingStepVm,
} from '@/test/create-v2v-mapping-step-vm.ts'
import { findShownComponents } from '@/test/find-shown-components.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import { v2vVmActionsMock } from '@/test/mock-v2v-vm-actions.ts'
import { getV2vVmKindActionList } from '@/test/v2v-vm-kind-actions.ts'
import VtsSidePanel from '@core/components/panel/VtsSidePanel.vue'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import { mount, type VueWrapper } from '@vue/test-utils'

vi.mock(
  import('@/modules/v2v/composables/use-v2v-vm-actions.composable.ts'),
  () => import('@/test/mock-v2v-vm-actions.ts')
)

beforeEach(() => {
  v2vVmActionsMock.reset()
})

const NEW_VM = createV2vNewMappingStepVm()

const RESUMED_VM = createV2vResumedMappingStepVm()

const NOT_FOUND_VM = createV2vNotFoundMappingStepVm()

const updateVm = vi.fn()

// The actions and the cards of each kind are covered by their own tests: here only which ones the panel shows matters
function mountPanel(vm: V2vMappingStepVm | undefined) {
  return mount(V2vVmSidePanel, {
    props: { vm, updateVm },
    global: createGlobalTestConfig({
      stubs: {
        V2vNewVmCards: true,
        V2vResumedVmCards: true,
        V2vVmHeadingCard: true,
      },
    }),
  })
}

const KIND_COMPONENTS = [V2vNewVmCards, V2vResumedVmCards]

function findKindComponents(wrapper: VueWrapper) {
  return findShownComponents(wrapper, KIND_COMPONENTS)
}

function findKindActionsVm(wrapper: VueWrapper) {
  return wrapper.getComponent(V2vVmKindActions).props('vm')
}

function findNotFoundHero(wrapper: VueWrapper) {
  return wrapper.findAllComponents(VtsStateHero).find(hero => hero.props('type') === 'not-found')
}

it.each([
  ['holds a selection, for the side panel to show it and offer to close it', NEW_VM, true],
  ['holds no selection without VM, for the side panel to show its empty state', undefined, false],
])('%s', (_, vm, hasSelection) => {
  expect(mountPanel(vm).getComponent(VtsSidePanel).props('hasSelection')).toBe(hasSelection)
})

it('shows neither heading, cards nor actions without VM', () => {
  const wrapper = mountPanel(undefined)

  expect(wrapper.findComponent(V2vVmHeadingCard).exists()).toBe(false)
  expect(findKindComponents(wrapper)).toEqual([])
  expect(wrapper.findComponent(V2vVmKindActions).exists()).toBe(false)
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

it('lays the actions of the VM out as a main button and a menu', () => {
  const wrapper = mountPanel(NEW_VM)

  expect(wrapper.getComponent(V2vVmActions).props()).toEqual(
    getV2vVmKindActionList(v2vVmActionsMock.useV2vNewVmActions)
  )
})

describe('new VM', () => {
  it('heads the panel with the actions of a new VM, stored through the list', () => {
    expect(mountPanel(NEW_VM).getComponent(V2vVmKindActions).props()).toEqual({ vm: NEW_VM, updateVm })
  })

  it('shows the mapping of the VM', () => {
    const wrapper = mountPanel(NEW_VM)

    expect(wrapper.getComponent(V2vNewVmCards).props()).toEqual({ vm: NEW_VM })
    expect(findKindComponents(wrapper)).toEqual([V2vNewVmCards])
  })
})

describe('resumed VM', () => {
  it('heads the panel with the actions of a resumed VM, and shows its first sync', () => {
    const wrapper = mountPanel(RESUMED_VM)

    expect([findKindActionsVm(wrapper), wrapper.getComponent(V2vResumedVmCards).props('vm')]).toEqual([
      RESUMED_VM,
      RESUMED_VM,
    ])
    expect(findKindComponents(wrapper)).toEqual([V2vResumedVmCards])
  })

  it('switches to the new VM it becomes once its import VM is deleted', async () => {
    const wrapper = mountPanel(RESUMED_VM)

    await wrapper.setProps({ vm: NEW_VM })

    expect([findKindActionsVm(wrapper), findKindComponents(wrapper)]).toEqual([NEW_VM, [V2vNewVmCards]])
  })
})

describe('VM not found in the source', () => {
  it('tells the VM is not found in the source, with its actions', () => {
    const wrapper = mountPanel(NOT_FOUND_VM)

    expect(findNotFoundHero(wrapper)?.text()).toBe(t('v2v:not-found-in-source'))
    expect(findKindActionsVm(wrapper)).toEqual(NOT_FOUND_VM)
    expect(findKindComponents(wrapper)).toEqual([])
  })

  it('has no not-found hero for a VM of the source', () => {
    expect(findNotFoundHero(mountPanel(NEW_VM))).toBeUndefined()
  })
})

it('emits the removal of its VM', async () => {
  const wrapper = mountPanel(NEW_VM)

  await wrapper.getComponent(V2vVmKindActions).vm.$emit('remove', NEW_VM.id)

  expect(wrapper.emitted('remove')).toEqual([[NEW_VM.id]])
})
