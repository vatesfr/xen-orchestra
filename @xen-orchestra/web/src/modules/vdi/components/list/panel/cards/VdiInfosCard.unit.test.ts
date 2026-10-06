import type { FrontXoVbd, useXoVbdCollection } from '@/modules/vbd/remote-resources/use-xo-vbd-collection.ts'
import VdiInfosCard from '@/modules/vdi/components/list/panel/cards/VdiInfosCard.vue'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { createVbd } from '@/test/create-vbd.ts'
import { createVdi } from '@/test/create-vdi.ts'
import { createVm } from '@/test/create-vm.ts'
import { findCardLabelledValues } from '@/test/find-labelled-values.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import { mount } from '@vue/test-utils'
import { computed } from 'vue'

const { getVbdsByIds, useGetVbdsByIds } = vi.hoisted(() => ({
  getVbdsByIds: vi.fn(),
  useGetVbdsByIds: vi.fn(),
}))

vi.mock(import('@/modules/vbd/remote-resources/use-xo-vbd-collection.ts'), () => ({
  useXoVbdCollection: (() => ({ getVbdsByIds, useGetVbdsByIds })) as unknown as typeof useXoVbdCollection,
}))

beforeEach(() => {
  getVbdsByIds.mockReset()
  useGetVbdsByIds.mockReset()

  getVbdsByIds.mockReturnValue([])
  useGetVbdsByIds.mockReturnValue(computed(() => []))
})

function mountInfosCard(vm?: FrontXoVm) {
  return mount(VdiInfosCard, {
    props: { vdi: createVdi({ id: 'vdi-42' as ReturnType<typeof createVdi>['id'] }), vm },
    global: createGlobalTestConfig(),
  })
}

function findTitleHref(wrapper: ReturnType<typeof mountInfosCard>) {
  return wrapper.get('.vts-card-object-title a').attributes('href')
}

it('links the title to the VDI page opened from a VM when a VM is given', () => {
  expect(findTitleHref(mountInfosCard(createVm()))).toBe('/vdi/vdi-42/general?from=vm')
})

it('links the title to the VDI page opened from an SR when no VM is given', () => {
  expect(findTitleHref(mountInfosCard())).toBe('/vdi/vdi-42/general?from=sr')
})

it('shows the device of the VBD plugging the VDI into the VM', () => {
  useGetVbdsByIds.mockReturnValue(
    computed(() => [
      createVbd({ VM: 'vm-other' as FrontXoVbd['VM'], device: 'xvdb' }),
      createVbd({ VM: 'vm-123' as FrontXoVbd['VM'], device: 'xvdc' }),
    ])
  )

  const wrapper = mountInfosCard(createVm({ id: 'vm-123' as FrontXoVm['id'] }))

  expect(findCardLabelledValues(wrapper)).toMatchObject({ [t('device')]: 'xvdc' })
})

it('leaves out the device row when no VM is given', () => {
  useGetVbdsByIds.mockReturnValue(computed(() => [createVbd({ device: 'xvdc' })]))

  expect(Object.keys(findCardLabelledValues(mountInfosCard()))).toEqual([t('description'), t('tags'), t('status')])
})
