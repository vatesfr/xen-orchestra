import type { useXoHostCollection } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import type { useXoPbdCollection } from '@/modules/pbd/remote-resources/use-xo-pbd-collection.ts'
import type { useXoSrCollection } from '@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'
import type { FrontXoVbd, useXoVbdCollection } from '@/modules/vbd/remote-resources/use-xo-vbd-collection.ts'
import VdiConfigurationCard from '@/modules/vdi/components/list/panel/cards/VdiConfigurationCard.vue'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { createPbd } from '@/test/create-pbd.ts'
import { createSr } from '@/test/create-sr.ts'
import { createVbd } from '@/test/create-vbd.ts'
import { createVdi } from '@/test/create-vdi.ts'
import { createVm } from '@/test/create-vm.ts'
import { findCardLabelledValues } from '@/test/find-labelled-values.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import { objectIcon } from '@core/icons'
import { mount } from '@vue/test-utils'
import { computed } from 'vue'

const { useGetSrById, isDefaultSr, useGetVbdsByIds, getPbdsByIds } = vi.hoisted(() => ({
  useGetSrById: vi.fn(),
  isDefaultSr: vi.fn(),
  useGetVbdsByIds: vi.fn(),
  getPbdsByIds: vi.fn(),
}))

vi.mock(import('@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'), () => ({
  useXoSrCollection: (() => ({ useGetSrById, isDefaultSr })) as unknown as typeof useXoSrCollection,
}))

vi.mock(import('@/modules/vbd/remote-resources/use-xo-vbd-collection.ts'), () => ({
  useXoVbdCollection: (() => ({ useGetVbdsByIds })) as unknown as typeof useXoVbdCollection,
}))

vi.mock(import('@/modules/pbd/remote-resources/use-xo-pbd-collection.ts'), () => ({
  useXoPbdCollection: (() => ({
    getPbdsByIds,
    pbdsBySr: computed(() => new Map()),
  })) as unknown as typeof useXoPbdCollection,
}))

vi.mock(import('@/modules/host/remote-resources/use-xo-host-collection.ts'), () => ({
  useXoHostCollection: (() => ({ getHostById: () => undefined })) as unknown as typeof useXoHostCollection,
}))

beforeEach(() => {
  useGetSrById.mockReset()
  isDefaultSr.mockReset()
  useGetVbdsByIds.mockReset()
  getPbdsByIds.mockReset()

  useGetSrById.mockReturnValue(computed(() => createSr({ id: 'sr-42' as ReturnType<typeof createSr>['id'] })))
  isDefaultSr.mockReturnValue(false)
  useGetVbdsByIds.mockReturnValue(computed(() => []))
  getPbdsByIds.mockReturnValue([])
})

function mountConfigurationCard(vm?: FrontXoVm) {
  return mount(VdiConfigurationCard, {
    props: { vdi: createVdi(), vm },
    global: createGlobalTestConfig(),
  })
}

it('lists the read-only and bootable rows when a VM is given', () => {
  expect(Object.keys(findCardLabelledValues(mountConfigurationCard(createVm())))).toEqual([
    t('format'),
    t('storage'),
    t('read-only'),
    t('change-block-tracking'),
    t('bootable'),
  ])
})

it('leaves out the read-only and bootable rows when no VM is given', () => {
  expect(Object.keys(findCardLabelledValues(mountConfigurationCard()))).toEqual([
    t('format'),
    t('storage'),
    t('change-block-tracking'),
  ])
})

it('reads the read-only and bootable flags from the VBD plugging the VDI into the VM', () => {
  useGetVbdsByIds.mockReturnValue(
    computed(() => [
      createVbd({ VM: 'vm-other' as FrontXoVbd['VM'], read_only: false, bootable: true }),
      createVbd({ VM: 'vm-123' as FrontXoVbd['VM'], read_only: true, bootable: false }),
    ])
  )

  const wrapper = mountConfigurationCard(createVm({ id: 'vm-123' as FrontXoVm['id'] }))

  expect(findCardLabelledValues(wrapper)).toMatchObject({
    [t('read-only')]: t('enabled'),
    [t('bootable')]: t('disabled'),
  })
})

it('links the storage to its SR page', () => {
  expect(mountConfigurationCard().get('.storage a').attributes('href')).toBe('/sr/sr-42/general')
})

it('shows the connection status of the SR on its link', () => {
  getPbdsByIds.mockReturnValue([createPbd({ attached: true }), createPbd({ attached: false })])

  expect(mountConfigurationCard().getComponent(UiLink).props('icon')).toBe(objectIcon('sr', 'partially-connected'))
})

it('flags the default SR of the pool', () => {
  isDefaultSr.mockReturnValue(true)

  const iconNames = mountConfigurationCard()
    .getComponent(UiLink)
    .findAllComponents(VtsIcon)
    .map(icon => icon.props('name'))

  expect(iconNames).toContain('status:primary-circle')
})

it('does not flag an SR that is not the default one', () => {
  const iconNames = mountConfigurationCard()
    .getComponent(UiLink)
    .findAllComponents(VtsIcon)
    .map(icon => icon.props('name'))

  expect(iconNames).not.toContain('status:primary-circle')
})
