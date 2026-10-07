import { useNewBondedNetworkForm } from '@/modules/network/form/new-bonded/use-new-bonded-network-form.ts'
import type { useXoNetworkCollection } from '@/modules/network/remote-resources/use-xo-network-collection.ts'
import type { useXoPifCollection } from '@/modules/pif/remote-resources/use-xo-pif-collection.ts'
import type { FrontXoPool, useXoPoolCollection } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import { mountComposable } from '@/test/mount-composable.ts'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

vi.mock(import('@/modules/pool/remote-resources/use-xo-pool-collection.ts'), () => ({
  useXoPoolCollection: (() => ({
    pools: ref([]),
    useGetPoolById: () => computed(() => undefined),
  })) as unknown as typeof useXoPoolCollection,
}))

vi.mock(import('@/modules/pif/remote-resources/use-xo-pif-collection.ts'), () => ({
  useXoPifCollection: (() => ({ pifs: ref([]) })) as unknown as typeof useXoPifCollection,
}))

vi.mock(import('@/modules/network/remote-resources/use-xo-network-collection.ts'), () => ({
  useXoNetworkCollection: (() => ({ getNetworkById: () => undefined })) as unknown as typeof useXoNetworkCollection,
}))

function mountNewBondedNetworkForm() {
  return mountComposable(() => {
    const { t } = useI18n()

    return { ...useNewBondedNetworkForm('pool-789' as FrontXoPool['id']), t }
  }).wrapper.vm
}

describe('interfaceSelectBindings', () => {
  it('reports missing interfaces on submit', async () => {
    const result = mountNewBondedNetworkForm()

    await result.validateAndBuildPayload()

    expect(result.interfaceSelectBindings.error).toMatchObject({ content: result.t('interface-required') })
  })
})

describe('bondModeSelectBindings', () => {
  it('reports a missing bond mode on submit', async () => {
    const result = mountNewBondedNetworkForm()

    await result.validateAndBuildPayload()

    expect(result.bondModeSelectBindings.error).toMatchObject({ content: result.t('bond-mode-required') })
  })
})
