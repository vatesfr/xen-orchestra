import { type BaseNetworkFormData, useNetworkFormBase } from '@/modules/network/form/use-network-form-base.ts'
import type { FrontXoPool, useXoPoolCollection } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import { createPool } from '@/test/create-pool.ts'
import { mountComposable } from '@/test/mount-composable.ts'
import { flushPromises } from '@vue/test-utils'
import { computed, type MaybeRefOrGetter, reactive, ref, toValue } from 'vue'
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

function mountNetworkFormBase(
  poolId: FrontXoPool['id'] | undefined = POOL_ID,
  initialData: Partial<BaseNetworkFormData> = {}
) {
  return mountComposable(() => {
    const { t } = useI18n()

    const formData = reactive<BaseNetworkFormData>({
      pool: undefined,
      name: '',
      description: '',
      mtu: undefined,
      nbd: false,
      ...initialData,
    })

    return { ...useNetworkFormBase(poolId, formData), t }
  }).wrapper.vm
}

describe('validate', () => {
  it('reports a missing name', async () => {
    const result = mountNetworkFormBase(POOL_ID, { name: '' })

    await expect(result.validate()).resolves.toBe(false)
    expect(result.nameInputBindings.error).toMatchObject({ content: result.t('name-required') })
  })

  it('reports a missing pool when the given pool is unknown', async () => {
    const result = mountNetworkFormBase('unknown-pool' as FrontXoPool['id'], { name: 'Network' })

    await expect(result.validate()).resolves.toBe(false)
    expect(result.poolSelectBindings.error).toMatchObject({ content: result.t('pool-required') })
  })

  it('passes with a pool and a name', async () => {
    const result = mountNetworkFormBase(POOL_ID, { name: 'Network' })

    await expect(result.validate()).resolves.toBe(true)
  })

  it('does not block on an out-of-range MTU', async () => {
    const result = mountNetworkFormBase(POOL_ID, { name: 'Network', mtu: 100 })

    await expect(result.validate()).resolves.toBe(true)
  })
})

describe('mtuInputBindings', () => {
  it('warns when the MTU is out of range', async () => {
    const result = mountNetworkFormBase(POOL_ID, { mtu: 100 })

    result.mtuInputBindings.onBlur()
    await flushPromises()

    expect(result.mtuInputBindings.warning).toMatchObject({
      content: result.t('network-create:warning:mtu-out-of-range', { min: 1280, max: 9000 }),
    })
  })

  it('does not warn for an MTU within range', async () => {
    const result = mountNetworkFormBase(POOL_ID, { mtu: 9000 })

    result.mtuInputBindings.onBlur()
    await flushPromises()

    expect(result.mtuInputBindings.warning).toBeUndefined()
  })

  it('does not warn when the MTU is left empty', async () => {
    const result = mountNetworkFormBase(POOL_ID, { mtu: undefined })

    result.mtuInputBindings.onBlur()
    await flushPromises()

    expect(result.mtuInputBindings.warning).toBeUndefined()
  })
})

describe('buildBasePayload', () => {
  it('sends only the pool and the name when the optional fields are empty', () => {
    const result = mountNetworkFormBase(POOL_ID, { name: 'Network' })

    expect(result.buildBasePayload()).toEqual({ poolId: POOL_ID, name: 'Network' })
  })

  it('adds the description, MTU and NBD when set', () => {
    const result = mountNetworkFormBase(POOL_ID, {
      name: 'Network',
      description: 'Storage traffic',
      mtu: 9000,
      nbd: true,
    })

    expect(result.buildBasePayload()).toEqual({
      poolId: POOL_ID,
      name: 'Network',
      description: 'Storage traffic',
      mtu: 9000,
      nbd: true,
    })
  })

  it('builds no payload when the given pool is unknown', () => {
    const result = mountNetworkFormBase('unknown-pool' as FrontXoPool['id'], { name: 'Network' })

    expect(result.buildBasePayload()).toBeUndefined()
  })
})
