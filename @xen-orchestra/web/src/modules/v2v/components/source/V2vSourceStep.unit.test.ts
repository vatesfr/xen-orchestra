import V2vRememberedConnectionList from '@/modules/v2v/components/source/V2vRememberedConnectionList.vue'
import V2vRememberedConnectionsCard from '@/modules/v2v/components/source/V2vRememberedConnectionsCard.vue'
import V2vSourceConnectionForm from '@/modules/v2v/components/source/V2vSourceConnectionForm.vue'
import V2vSourceStep from '@/modules/v2v/components/source/V2vSourceStep.vue'
import type { useV2vSourceStep } from '@/modules/v2v/composables/use-v2v-source-step.composable.ts'
import { createV2vRememberedConnection } from '@/test/create-v2v-connection.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { vmCollectionMock } from '@/test/mock-xo-vm-collection.ts'
import { mount } from '@vue/test-utils'

const { sourceStepMock } = await vi.hoisted(async () => {
  const vue = await import('vue')

  return {
    sourceStepMock: {
      form: {},
      rememberedConnections: vue.ref<ReturnType<typeof createV2vRememberedConnection>[]>([]),
      canConnect: vue.ref(true),
      isConnecting: vue.ref(false),
      submit: vi.fn(),
      connectRemembered: vi.fn(),
      editRemembered: vi.fn(),
      forgetRemembered: vi.fn(),
      forgetRememberedPassword: vi.fn(),
      cancel: vi.fn(),
    },
  }
})

vi.mock(import('@/modules/v2v/composables/use-v2v-source-step.composable.ts'), () => ({
  useV2vSourceStep: (() => ({
    ...sourceStepMock,
    prerequisite: { state: 'ok' },
    connectionError: undefined,
  })) as unknown as typeof useV2vSourceStep,
}))

vi.mock(
  import('@/modules/vm/remote-resources/use-xo-vm-collection.ts'),
  () => import('@/test/mock-xo-vm-collection.ts')
)

const REMEMBERED = createV2vRememberedConnection({ host: 'remembered.lab' })

beforeEach(() => {
  vi.clearAllMocks()
  vmCollectionMock.reset()
  sourceStepMock.rememberedConnections.value = [REMEMBERED]
  sourceStepMock.canConnect.value = true
  sourceStepMock.isConnecting.value = false
})

// The connection form renders its own fields from a real form, covered by its own test: here only its wiring matters
function mountStep() {
  return mount(V2vSourceStep, {
    global: { ...createGlobalTestConfig(), stubs: { V2vSourceConnectionForm: true } },
  })
}

it('shows the remembered connections next to the connection form', () => {
  const wrapper = mountStep()

  expect(wrapper.getComponent(V2vRememberedConnectionsCard).getComponent(V2vRememberedConnectionList).props()).toEqual({
    connections: [REMEMBERED],
    disabled: false,
  })
  expect(wrapper.getComponent(V2vSourceConnectionForm).props()).toEqual({
    form: sourceStepMock.form,
    prerequisite: { state: 'ok' },
    canConnect: true,
    isConnecting: false,
    connectionError: undefined,
  })
})

it.each([
  ['the prerequisites are not met', { canConnect: false, isConnecting: false }],
  ['a connection is in progress', { canConnect: true, isConnecting: true }],
])('disables the remembered connections while %s', (_, { canConnect, isConnecting }) => {
  sourceStepMock.canConnect.value = canConnect
  sourceStepMock.isConnecting.value = isConnecting

  expect(mountStep().getComponent(V2vRememberedConnectionList).props('disabled')).toBe(true)
})

it.each([
  ['connect', 'connectRemembered'],
  ['edit', 'editRemembered'],
  ['forget', 'forgetRemembered'],
  ['forgetPassword', 'forgetRememberedPassword'],
] as const)('handles %s on a remembered connection with %s', (event, handler) => {
  mountStep().getComponent(V2vRememberedConnectionList).vm.$emit(event, REMEMBERED)

  expect(sourceStepMock[handler]).toHaveBeenCalledWith(REMEMBERED)
})

it.each(['submit', 'cancel'] as const)('handles %s of the connection form', event => {
  mountStep().getComponent(V2vSourceConnectionForm).vm.$emit(event)

  expect(sourceStepMock[event]).toHaveBeenCalledOnce()
})
