import {
  createV2vConnectionContext,
  provideV2vConnection,
  useV2vConnection,
} from '@/modules/v2v/composables/use-v2v-connection.composable.ts'
import { createV2vConnection } from '@/test/create-v2v-connection.ts'
import { createV2vInventory } from '@/test/create-v2v-inventory.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { mountComposable } from '@/test/mount-composable.ts'
import { v2vConnectionProvide } from '@/test/v2v-connection-provide.ts'
import { mount } from '@vue/test-utils'
import { defineComponent, h } from 'vue'

describe('createV2vConnectionContext', () => {
  it('is not connected at first', () => {
    const context = createV2vConnectionContext()

    expect(context.connection.value).toBeUndefined()
    expect(context.inventory.value).toBeUndefined()
  })

  it('keeps the connection and its inventory', () => {
    const context = createV2vConnectionContext()
    const connection = createV2vConnection()
    const inventory = createV2vInventory()

    context.setConnection(connection, inventory)

    expect(context.connection.value).toEqual(connection)
    expect(context.inventory.value).toEqual(inventory)
  })
})

describe('sourceId', () => {
  it('is unknown before connecting', () => {
    expect(createV2vConnectionContext().sourceId.value).toBeUndefined()
  })

  it('is the vCenter instance UUID', () => {
    const context = createV2vConnectionContext()

    context.setConnection(createV2vConnection(), createV2vInventory({ instanceUuid: 'vcenter-uuid-2' }))

    expect(context.sourceId.value).toBe('vcenter-uuid-2')
  })

  it('is the connection address for a standalone ESXi', () => {
    const context = createV2vConnectionContext()

    context.setConnection(
      createV2vConnection({ host: 'esxi.lab', port: 443 }),
      createV2vInventory({ instanceUuid: undefined })
    )

    expect(context.sourceId.value).toBe('esxi.lab:443')
  })
})

describe('provideV2vConnection', () => {
  function mountProvidedContext() {
    const Step = defineComponent({ setup: () => ({ context: useV2vConnection() }), render: () => null })

    const wrapper = mount(
      defineComponent(() => {
        provideV2vConnection()

        return () => h(Step)
      }),
      { global: createGlobalTestConfig() }
    )

    return wrapper.getComponent(Step).vm.context
  }

  it('gives each wizard a new context, without the connection of the previous one', () => {
    const previousContext = mountProvidedContext()
    previousContext.setConnection(createV2vConnection(), createV2vInventory())

    const context = mountProvidedContext()

    expect(context).not.toBe(previousContext)
    expect(context.connection.value).toBeUndefined()
    expect(context.inventory.value).toBeUndefined()
  })
})

describe('useV2vConnection', () => {
  it('reads the context provided by the wizard', () => {
    const context = createV2vConnectionContext()

    const { wrapper } = mountComposable(() => ({ injected: useV2vConnection() }), {
      provide: v2vConnectionProvide(context),
    })

    expect(wrapper.vm.injected).toBe(context)
  })

  it('throws outside of the wizard', () => {
    expect(() => mountComposable(() => ({ injected: useV2vConnection() }))).toThrow(
      'useV2vConnection must be called under the V2V migration page'
    )
  })
})
