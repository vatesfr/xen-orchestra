import type { useXoHostCollection } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import type { useXoPbdCollection } from '@/modules/pbd/remote-resources/use-xo-pbd-collection.ts'
import type { useXoSrCollection } from '@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'
import VdiDetailConfiguration from '@/modules/vdi/components/detail/VdiDetailConfiguration.vue'
import type { FrontXoVdi } from '@/modules/vdi/remote-resources/use-xo-vdi-collection.ts'
import { createSr } from '@/test/create-sr.ts'
import { createVdi } from '@/test/create-vdi.ts'
import { findLabelledValues } from '@/test/find-labelled-values.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import { mount } from '@vue/test-utils'
import { computed } from 'vue'

const { useGetSrById } = vi.hoisted(() => ({
  useGetSrById: vi.fn(),
}))

vi.mock(import('@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'), () => ({
  useXoSrCollection: (() => ({ useGetSrById, isDefaultSr: () => false })) as unknown as typeof useXoSrCollection,
}))

vi.mock(import('@/modules/pbd/remote-resources/use-xo-pbd-collection.ts'), () => ({
  useXoPbdCollection: (() => ({
    getPbdsByIds: () => [],
    pbdsBySr: computed(() => new Map()),
  })) as unknown as typeof useXoPbdCollection,
}))

vi.mock(import('@/modules/host/remote-resources/use-xo-host-collection.ts'), () => ({
  useXoHostCollection: (() => ({ getHostById: () => undefined })) as unknown as typeof useXoHostCollection,
}))

beforeEach(() => {
  useGetSrById.mockReset()
  useGetSrById.mockReturnValue(computed(() => createSr({ id: 'sr-42' as ReturnType<typeof createSr>['id'] })))
})

function mountConfiguration(vdi: FrontXoVdi = createVdi()) {
  return mount(VdiDetailConfiguration, {
    props: { vdi },
    global: createGlobalTestConfig(),
  })
}

it('shows the format of the VDI in uppercase', () => {
  expect(findLabelledValues(mountConfiguration(createVdi({ image_format: 'qcow2' })))).toMatchObject({
    [t('format')]: 'QCOW2',
  })
})

it('falls back to the VHD format when the VDI reports none', () => {
  expect(findLabelledValues(mountConfiguration(createVdi({ image_format: undefined })))).toMatchObject({
    [t('format')]: 'VHD',
  })
})

it('links the storage to its SR page', () => {
  expect(mountConfiguration().get('.vts-tabular-key-value-row a').attributes('href')).toBe('/sr/sr-42/general')
})
