import type { useXoHostCollection } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import type { useXoPbdCollection } from '@/modules/pbd/remote-resources/use-xo-pbd-collection.ts'
import type { useXoSrCollection } from '@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'
import type { FrontXoVbd, useXoVbdCollection } from '@/modules/vbd/remote-resources/use-xo-vbd-collection.ts'
import VdiConfigurationCard from '@/modules/vdi/components/list/panel/cards/VdiConfigurationCard.vue'
import type { FrontXoVm, useXoVmCollection } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { VDI_PAGE_CONTEXT, type VdiPageContext } from '@/shared/constants.ts'
import { createSr } from '@/test/create-sr.ts'
import { createVbd } from '@/test/create-vbd.ts'
import { createVdi } from '@/test/create-vdi.ts'
import { createVm } from '@/test/create-vm.ts'
import { findCardCopiedValues, findCardLabelledValues } from '@/test/find-labelled-values.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import { mount } from '@vue/test-utils'
import { computed } from 'vue'

const { useGetSrById, isDefaultSr, useGetVbdsByIds, useGetVmsByIds, getPbdsByIds } = vi.hoisted(() => ({
  useGetSrById: vi.fn(),
  isDefaultSr: vi.fn(),
  useGetVbdsByIds: vi.fn(),
  useGetVmsByIds: vi.fn(),
  getPbdsByIds: vi.fn(),
}))

vi.mock(import('@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'), () => ({
  useXoSrCollection: (() => ({ useGetSrById, isDefaultSr })) as unknown as typeof useXoSrCollection,
}))

vi.mock(import('@/modules/vbd/remote-resources/use-xo-vbd-collection.ts'), () => ({
  useXoVbdCollection: (() => ({ useGetVbdsByIds })) as unknown as typeof useXoVbdCollection,
}))

vi.mock(import('@/modules/vm/remote-resources/use-xo-vm-collection.ts'), () => ({
  useXoVmCollection: (() => ({ useGetVmsByIds })) as unknown as typeof useXoVmCollection,
}))

vi.mock(import('@/modules/pbd/remote-resources/use-xo-pbd-collection.ts'), () => ({
  useXoPbdCollection: (() => ({ getPbdsByIds })) as unknown as typeof useXoPbdCollection,
}))

vi.mock(import('@/modules/host/remote-resources/use-xo-host-collection.ts'), () => ({
  useXoHostCollection: (() => ({})) as unknown as typeof useXoHostCollection,
}))

beforeEach(() => {
  useGetSrById.mockReset()
  isDefaultSr.mockReset()
  useGetVbdsByIds.mockReset()
  useGetVmsByIds.mockReset()
  getPbdsByIds.mockReset()

  useGetSrById.mockReturnValue(computed(() => createSr({ name_label: 'Fast SR' })))
  isDefaultSr.mockReturnValue(false)
  useGetVbdsByIds.mockReturnValue(computed(() => []))
  useGetVmsByIds.mockReturnValue(computed(() => []))
  getPbdsByIds.mockReturnValue([])
})

function givenVms(...vms: FrontXoVm[]) {
  useGetVmsByIds.mockReturnValue(computed(() => vms))
}

function mountCard(fromContext: VdiPageContext, vbd?: FrontXoVbd) {
  return mount(VdiConfigurationCard, {
    props: { vdi: createVdi({ image_format: 'qcow2', cbt_enabled: true, tags: ['NOSNAP'] }), vbd, fromContext },
    global: createGlobalTestConfig(),
  })
}

describe('in the VM context', () => {
  it('shows the storage and the VBD flags', () => {
    const wrapper = mountCard(VDI_PAGE_CONTEXT.VM, createVbd({ read_only: true, bootable: false }))

    expect(findCardLabelledValues(wrapper)).toEqual({
      [t('format')]: 'QCOW2',
      [t('storage')]: 'Fast SR',
      [t('read-only')]: t('enabled'),
      [t('bootable')]: t('disabled'),
      [t('change-block-tracking')]: t('enabled'),
      [t('operation:snapshot')]: t('disabled'),
    })
  })

  it('copies the format and the SR name', () => {
    expect(findCardCopiedValues(mountCard(VDI_PAGE_CONTEXT.VM, createVbd()))).toEqual(['QCOW2', 'Fast SR'])
  })

  it('leaves the storage empty, with nothing to copy, while the SR is not resolved', () => {
    useGetSrById.mockReturnValue(computed(() => undefined))

    const wrapper = mountCard(VDI_PAGE_CONTEXT.VM, createVbd())

    expect(findCardLabelledValues(wrapper)[t('storage')]).toBe('')
    expect(findCardCopiedValues(wrapper)).toEqual(['QCOW2'])
  })
})

describe('in the SR context', () => {
  it('shows the VMs instead of the storage and the VBD flags', () => {
    givenVms(createVm({ name_label: 'Web server' }))

    expect(findCardLabelledValues(mountCard(VDI_PAGE_CONTEXT.SR))).toEqual({
      [t('format')]: 'QCOW2',
      [t('vms')]: 'Web server',
      [t('change-block-tracking')]: t('enabled'),
      [t('operation:snapshot')]: t('disabled'),
    })
  })

  it('copies the names of every VM, comma-separated', () => {
    givenVms(
      createVm({ id: 'vm-1' as FrontXoVm['id'], name_label: 'Web server' }),
      createVm({ id: 'vm-2' as FrontXoVm['id'], name_label: 'Database' })
    )

    expect(findCardCopiedValues(mountCard(VDI_PAGE_CONTEXT.SR))).toEqual(['QCOW2', 'Web server, Database'])
  })

  it('has no VM names to copy when the VDI is plugged into no VM', () => {
    expect(findCardCopiedValues(mountCard(VDI_PAGE_CONTEXT.SR))).toEqual(['QCOW2'])
  })
})
