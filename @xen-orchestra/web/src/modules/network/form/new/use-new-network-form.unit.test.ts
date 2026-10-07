import { useNewNetworkForm } from '@/modules/network/form/new/use-new-network-form.ts'
import type { useXoNetworkCollection } from '@/modules/network/remote-resources/use-xo-network-collection.ts'
import type { useXoPifCollection } from '@/modules/pif/remote-resources/use-xo-pif-collection.ts'
import type { FrontXoPool, useXoPoolCollection } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import { createPool } from '@/test/create-pool.ts'
import { mountComposable } from '@/test/mount-composable.ts'
import { flushPromises } from '@vue/test-utils'
import { computed, type MaybeRefOrGetter, ref, toValue } from 'vue'
import { useI18n } from 'vue-i18n'

const POOL_ID = 'pool-789' as FrontXoPool['id']

vi.mock(import('@/modules/pool/remote-resources/use-xo-pool-collection.ts'), () => ({
  useXoPoolCollection: (() => {
    const pools = ref([createPool({ id: POOL_ID })])

    return {
      pools,
      useGetPoolById: (id: MaybeRefOrGetter<FrontXoPool['id'] | undefined>) =>
        computed(() => pools.value.find(pool => pool.id === toValue(id))),
    }
  }) as unknown as typeof useXoPoolCollection,
}))

vi.mock(import('@/modules/pif/remote-resources/use-xo-pif-collection.ts'), () => ({
  useXoPifCollection: (() => ({ pifs: ref([]) })) as unknown as typeof useXoPifCollection,
}))

vi.mock(import('@/modules/network/remote-resources/use-xo-network-collection.ts'), () => ({
  useXoNetworkCollection: (() => ({ getNetworkById: () => undefined })) as unknown as typeof useXoNetworkCollection,
}))

const VLAN_MAX = 4094

function mountNewNetworkForm() {
  return mountComposable(() => {
    const { t } = useI18n()

    return { ...useNewNetworkForm(POOL_ID), t }
  }).wrapper.vm
}

type NewNetworkForm = ReturnType<typeof mountNewNetworkForm>

async function blurVlan(form: NewNetworkForm, vlan: number) {
  form.vlanInputBindings['onUpdate:modelValue'](vlan)
  form.vlanInputBindings.onBlur()
  await flushPromises()
}

describe('vlanInputBindings', () => {
  it('marks the VLAN as required', () => {
    const result = mountNewNetworkForm()

    expect(result.vlanInputBindings.required).toBe(true)
  })

  it('reports a missing VLAN on submit', async () => {
    const result = mountNewNetworkForm()

    await result.validateAndBuildPayload()

    expect(result.vlanInputBindings.error).toMatchObject({ content: result.t('vlan-required') })
  })

  it('accepts VLAN 0', async () => {
    const result = mountNewNetworkForm()

    result.vlanInputBindings['onUpdate:modelValue'](0)
    await result.validateAndBuildPayload()

    expect(result.vlanInputBindings.error).toBeUndefined()
  })

  it('warns when the VLAN is out of range', async () => {
    const result = mountNewNetworkForm()

    await blurVlan(result, VLAN_MAX + 1)

    expect(result.vlanInputBindings.warning).toMatchObject({
      content: result.t('network-create:warning:vlan-out-of-range', { max: VLAN_MAX }),
    })
  })

  it('does not warn for a VLAN within range', async () => {
    const result = mountNewNetworkForm()

    await blurVlan(result, VLAN_MAX)

    expect(result.vlanInputBindings.warning).toBeUndefined()
  })
})

describe('interfaceSelectBindings', () => {
  it('reports a missing interface on submit', async () => {
    const result = mountNewNetworkForm()

    await result.validateAndBuildPayload()

    expect(result.interfaceSelectBindings.error).toMatchObject({ content: result.t('interface-required') })
  })
})

describe('validateAndBuildPayload', () => {
  it('builds no payload while no interface is selected', async () => {
    const result = mountNewNetworkForm()

    result.nameInputBindings['onUpdate:modelValue']('Network')
    result.vlanInputBindings['onUpdate:modelValue'](10)

    await expect(result.validateAndBuildPayload()).resolves.toBeUndefined()
  })
})
