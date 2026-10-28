import { useV2vSourceStep } from '@/modules/v2v/composables/use-v2v-source-step.composable.ts'
import { useV2vConnectionStore } from '@/modules/v2v/stores/v2v-connection.store.ts'
import type { V2vRememberedConnection } from '@/modules/v2v/types/v2v-remembered-connection.type.ts'
import { getV2vSourceId } from '@/modules/v2v/utils/v2v-source.util.ts'
import { createV2vConnection, createV2vRememberedConnection } from '@/test/create-v2v-connection.ts'
import { createV2vInventory } from '@/test/create-v2v-inventory.ts'
import { createV2vWizardRouter } from '@/test/create-v2v-wizard-router.ts'
import { fillV2vConnectionForm } from '@/test/fill-v2v-connection-form.ts'
import { invalidCredentialsMessage } from '@/test/form-messages.ts'
import { deleteModalMock } from '@/test/mock-delete-modal.ts'
import { v2vStatusMock } from '@/test/mock-xo-v2v-status.ts'
import { mountComposableWithI18n } from '@/test/mount-composable.ts'
import { NOW } from '@/test/now.ts'
import { silenceConsoleError } from '@/test/silence-console-error.ts'
import { stubFetchResponse } from '@/test/stub-fetch-response.ts'
import { seedV2vRememberedConnections } from '@/test/v2v-remembered-connections-storage.ts'
import { V2V_ERROR_CODE, V2V_PLATFORM, type XoV2vConnection } from '@vates/types'
import { flushPromises } from '@vue/test-utils'
import { omit } from 'lodash-es'

vi.mock(import('@/modules/v2v/remote-resources/use-xo-v2v-status.ts'), () => import('@/test/mock-xo-v2v-status.ts'))

vi.mock(import('@core/composables/modals/use-delete-modal.ts'), () => import('@/test/mock-delete-modal.ts'))

beforeEach(() => {
  v2vStatusMock.reset()
  deleteModalMock.reset()
  vi.useFakeTimers({ now: NOW, toFake: ['Date'] })
})

afterEach(() => {
  vi.useRealTimers()
})

async function mountSourceStep(options: Parameters<typeof useV2vSourceStep>[0] = {}) {
  const router = await createV2vWizardRouter('source')

  const result = mountComposableWithI18n(() => ({ ...useV2vSourceStep(options), store: useV2vConnectionStore() }), {
    router,
  })

  return { result, router }
}

type SourceStep = Awaited<ReturnType<typeof mountSourceStep>>['result']

async function submitConnection(result: SourceStep, connection: XoV2vConnection = createV2vConnection()) {
  fillV2vConnectionForm(result.form, connection)
  await result.submit()
  await flushPromises()
}

describe('submit', () => {
  it('does not connect while the form is invalid', async () => {
    const fetchMock = stubFetchResponse(200, createV2vInventory())
    const { result, router } = await mountSourceStep()

    await result.submit()

    expect(fetchMock).not.toHaveBeenCalled()
    expect(router.currentRoute.value.query.step).toBe('source')
  })

  it('does not connect while the prerequisites are not met', async () => {
    v2vStatusMock.canConnectV2vSource.value = false
    const fetchMock = stubFetchResponse(200, createV2vInventory())
    const { result } = await mountSourceStep()

    await submitConnection(result)

    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('keeps the connection and its inventory, then opens the destination step', async () => {
    const inventory = createV2vInventory()
    stubFetchResponse(200, inventory)
    const { result, router } = await mountSourceStep()
    const connection = createV2vConnection()

    await submitConnection(result, connection)

    expect(result.store.connection).toEqual(connection)
    expect(result.store.inventory).toEqual(inventory)
    expect(router.currentRoute.value.query.step).toBe('destination')
  })

  it('remembers the connection with what the inventory told about the source when asked to', async () => {
    const inventory = createV2vInventory()
    stubFetchResponse(200, inventory)
    const { result } = await mountSourceStep()
    const connection = createV2vConnection()
    result.form.formData.remember = true

    await submitConnection(result, connection)

    expect(result.rememberedConnections).toEqual([
      {
        ...connection,
        platform: V2V_PLATFORM.VMWARE,
        product: inventory.product,
        version: inventory.version,
        sourceId: getV2vSourceId(connection, inventory.instanceUuid),
        vmCount: inventory.vms.length,
        lastUsedAt: NOW,
      },
    ])
  })

  it('does not remember a new connection otherwise', async () => {
    stubFetchResponse(200, createV2vInventory())
    const { result } = await mountSourceStep()

    await submitConnection(result)

    expect(result.rememberedConnections).toEqual([])
  })

  it('refreshes an already remembered connection, still without its password', async () => {
    const inventory = createV2vInventory()
    stubFetchResponse(200, inventory)
    const connection = createV2vConnection()
    seedV2vRememberedConnections([omit(createV2vRememberedConnection({ lastUsedAt: 1, vmCount: 1 }), 'password')])
    const { result } = await mountSourceStep()

    await submitConnection(result, connection)

    expect(result.rememberedConnections).toHaveLength(1)
    expect(result.rememberedConnections[0]).toMatchObject({ vmCount: inventory.vms.length, lastUsedAt: NOW })
    expect(result.rememberedConnections[0]).not.toHaveProperty('password')
  })

  it('reports invalid credentials on the form and stays on the source step', async () => {
    stubFetchResponse(422, { error: 'invalid credentials', data: { code: V2V_ERROR_CODE.INVALID_CREDENTIALS } })
    const { result, router } = await mountSourceStep()

    await submitConnection(result)

    expect(result.form.usernameInputBindings.error).toEqual(invalidCredentialsMessage())
    expect(result.form.passwordInputBindings.error).toEqual(invalidCredentialsMessage())
    expect(result.connectionError).toBeUndefined()
    expect(result.store.connection).toBeUndefined()
    expect(router.currentRoute.value.query.step).toBe('source')
  })

  it('reports any other failure as a connection error', async () => {
    silenceConsoleError()
    stubFetchResponse(500, { error: 'unreachable' })
    const { result, router } = await mountSourceStep()

    await submitConnection(result)

    expect(result.connectionError).toBe('unreachable')
    expect(router.currentRoute.value.query.step).toBe('source')
  })

  it('reports a generic error when the failure carries no message', async () => {
    silenceConsoleError()
    stubFetchResponse(500, {})
    const { result } = await mountSourceStep()

    await submitConnection(result)

    expect(result.connectionError).toBe(result.t('error'))
  })

  it('is connecting while the inventory loads', async () => {
    const { result } = await mountSourceStep()
    fillV2vConnectionForm(result.form)

    // The default `fetch` stub never settles: awaiting the submission would hang the test
    void result.submit()
    await flushPromises()

    expect(result.isConnecting).toBe(true)
  })
})

describe('connectRemembered', () => {
  it('connects at once with a remembered password', async () => {
    const inventory = createV2vInventory()
    stubFetchResponse(200, inventory)
    const remembered = createV2vRememberedConnection()
    seedV2vRememberedConnections([remembered])
    const { result, router } = await mountSourceStep()

    await result.connectRemembered(remembered)
    await flushPromises()

    expect(result.store.inventory).toEqual(inventory)
    expect(router.currentRoute.value.query.step).toBe('destination')
  })

  it('marks the remembered connection as just used', async () => {
    stubFetchResponse(200, createV2vInventory())
    const remembered = createV2vRememberedConnection({ lastUsedAt: 1 })
    seedV2vRememberedConnections([remembered])
    const { result } = await mountSourceStep()

    await result.connectRemembered(remembered)
    await flushPromises()

    expect(result.rememberedConnections[0].lastUsedAt).toBe(NOW)
  })

  it('fills the form and asks for the password when none was remembered', async () => {
    const fetchMock = stubFetchResponse(200, createV2vInventory())
    const onPasswordRequired = vi.fn()
    const remembered = omit(createV2vRememberedConnection(), 'password')
    const { result } = await mountSourceStep({ onPasswordRequired })

    await result.connectRemembered(remembered)

    expect(fetchMock).not.toHaveBeenCalled()
    expect(result.form.formData).toMatchObject({ host: remembered.host, username: remembered.username, password: '' })
    expect(onPasswordRequired).toHaveBeenCalledOnce()
  })
})

describe('editRemembered', () => {
  it('fills the form without connecting', async () => {
    const fetchMock = stubFetchResponse(200, createV2vInventory())
    const remembered = createV2vRememberedConnection({ host: 'edited.lab' })
    const { result } = await mountSourceStep()

    result.editRemembered(remembered)

    expect(fetchMock).not.toHaveBeenCalled()
    expect(result.form.formData.host).toBe('edited.lab')
  })

  const EDITED = createV2vRememberedConnection({ host: 'edited.lab' })

  async function mountEditing(edited: V2vRememberedConnection, otherConnections: V2vRememberedConnection[] = []) {
    seedV2vRememberedConnections([edited, ...otherConnections])
    const { result } = await mountSourceStep()
    result.editRemembered(edited)

    return result
  }

  async function connectEdited(edited: V2vRememberedConnection, connection: XoV2vConnection) {
    const result = await mountEditing(edited)
    await submitConnection(result, connection)

    return result
  }

  it.each([
    ['host', { host: 'renamed.lab' }],
    ['port', { host: EDITED.host, port: 8443 }],
    ['username', { host: EDITED.host, username: 'other@vsphere.local' }],
  ])('replaces the edited connection when its %s changed', async (_field, changes) => {
    stubFetchResponse(200, createV2vInventory())

    const result = await connectEdited(EDITED, createV2vConnection(changes))

    expect(result.rememberedConnections).toHaveLength(1)
    expect(result.rememberedConnections[0]).toMatchObject({ ...changes, password: EDITED.password })
  })

  it('keeps the edited connection remembered, still without its password', async () => {
    stubFetchResponse(200, createV2vInventory())

    const result = await connectEdited(omit(EDITED, 'password'), createV2vConnection({ host: 'renamed.lab' }))

    expect(result.rememberedConnections).toHaveLength(1)
    expect(result.rememberedConnections[0].host).toBe('renamed.lab')
    expect(result.rememberedConnections[0]).not.toHaveProperty('password')
  })

  it('updates the edited connection in place when its host, port and username did not change', async () => {
    stubFetchResponse(200, createV2vInventory())

    const result = await connectEdited(EDITED, createV2vConnection({ host: EDITED.host, password: 'new-secret' }))

    expect(result.rememberedConnections).toHaveLength(1)
    expect(result.rememberedConnections[0]).toMatchObject({ host: EDITED.host, password: 'new-secret' })
  })

  it('keeps the edited connection when the connection fails', async () => {
    stubFetchResponse(422, { error: 'invalid credentials', data: { code: V2V_ERROR_CODE.INVALID_CREDENTIALS } })

    const result = await connectEdited(EDITED, createV2vConnection({ host: 'renamed.lab' }))

    expect(result.rememberedConnections).toEqual([EDITED])
  })

  it('saves the connection as a new one when the edited connection was forgotten meanwhile', async () => {
    stubFetchResponse(200, createV2vInventory())
    deleteModalMock.answer('onConfirm')
    const result = await mountEditing(EDITED)

    await result.forgetRemembered(EDITED)
    await submitConnection(result, createV2vConnection({ host: 'renamed.lab' }))

    expect(result.rememberedConnections.map(connection => connection.host)).toEqual(['renamed.lab'])
  })

  it('stops editing once connected', async () => {
    stubFetchResponse(200, createV2vInventory())
    const result = await connectEdited(EDITED, createV2vConnection({ host: EDITED.host }))
    result.form.formData.remember = false

    await submitConnection(result, createV2vConnection({ host: 'other.lab' }))

    expect(result.rememberedConnections.map(connection => connection.host)).toEqual([EDITED.host])
  })

  it('stops editing on cancel', async () => {
    stubFetchResponse(200, createV2vInventory())
    const result = await mountEditing(EDITED)

    result.cancel()
    await submitConnection(result, createV2vConnection({ host: 'other.lab' }))

    expect(result.rememberedConnections).toEqual([EDITED])
  })

  it('stops editing when another remembered connection is connected', async () => {
    stubFetchResponse(200, createV2vInventory())
    const other = createV2vRememberedConnection({ host: 'other.lab', lastUsedAt: 1 })
    const result = await mountEditing(EDITED, [other])

    await result.connectRemembered(other)
    await flushPromises()

    expect(result.rememberedConnections.map(connection => connection.host).sort()).toEqual([EDITED.host, other.host])
  })
})

describe('forgetRemembered', () => {
  it('forgets the connection once confirmed', async () => {
    deleteModalMock.answer('onConfirm')
    const remembered = createV2vRememberedConnection()
    seedV2vRememberedConnections([remembered])
    const { result } = await mountSourceStep()

    await result.forgetRemembered(remembered)

    expect(deleteModalMock.open).toHaveBeenCalledWith({
      props: { subject: remembered.host, confirmLabel: result.t('action:forget') },
    })
    expect(result.rememberedConnections).toEqual([])
  })

  it('keeps the connection when cancelled', async () => {
    deleteModalMock.answer('onCancel')
    const remembered = createV2vRememberedConnection()
    seedV2vRememberedConnections([remembered])
    const { result } = await mountSourceStep()

    await result.forgetRemembered(remembered)

    expect(result.rememberedConnections).toEqual([remembered])
  })
})

describe('forgetRememberedPassword', () => {
  it('forgets only the password of the connection', async () => {
    const remembered = createV2vRememberedConnection()
    seedV2vRememberedConnections([remembered])
    const { result } = await mountSourceStep()

    result.forgetRememberedPassword(remembered)

    expect(result.rememberedConnections).toEqual([omit(remembered, 'password')])
  })
})

describe('cancel', () => {
  it('resets the form and the connection error', async () => {
    silenceConsoleError()
    stubFetchResponse(500, { error: 'unreachable' })
    const { result } = await mountSourceStep()
    await submitConnection(result)

    result.cancel()

    expect(result.form.formData.host).toBe('')
    expect(result.connectionError).toBeUndefined()
  })
})
