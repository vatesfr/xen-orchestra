import type { FrontXoVbd, useXoVbdCollection } from '@/modules/vbd/remote-resources/use-xo-vbd-collection.ts'
import VdiInfosCard from '@/modules/vdi/components/list/panel/cards/VdiInfosCard.vue'
import type { FrontXoVdi } from '@/modules/vdi/remote-resources/use-xo-vdi-collection.ts'
import { createVbd } from '@/test/create-vbd.ts'
import { createVdi } from '@/test/create-vdi.ts'
import { findCardCopiedValues, findCardLabelledValues } from '@/test/find-rendered-values.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import UiPanelCardTitle from '@core/components/ui/panel-card-title/UiPanelCardTitle.vue'
import { CONNECTION_STATUS } from '@core/types/connection.ts'
import { mount } from '@vue/test-utils'

const { getVbdsByIds } = vi.hoisted(() => ({
  getVbdsByIds: vi.fn(),
}))

vi.mock(import('@/modules/vbd/remote-resources/use-xo-vbd-collection.ts'), () => ({
  useXoVbdCollection: (() => ({ getVbdsByIds })) as unknown as typeof useXoVbdCollection,
}))

beforeEach(() => {
  getVbdsByIds.mockReset()

  getVbdsByIds.mockReturnValue([])
})

function mountCard(vdi: FrontXoVdi = createVdi(), vbd?: FrontXoVbd) {
  return mount(VdiInfosCard, {
    props: { vdi, vbd },
    global: createGlobalTestConfig(),
  })
}

it('shows the description, tags, status and device of a VDI shown with its VBD', () => {
  getVbdsByIds.mockReturnValue([createVbd({ attached: true })])

  const wrapper = mountCard(
    createVdi({ name_description: 'System disk', tags: ['prod'] }),
    createVbd({ device: 'xvdb' })
  )

  expect(findCardLabelledValues(wrapper)).toEqual({
    [t('description')]: 'System disk',
    [t('tags')]: 'prod',
    [t('status')]: t('connected'),
    [t('device')]: 'xvdb',
  })
  expect(findCardCopiedValues(wrapper)).toEqual(['System disk', 'prod', CONNECTION_STATUS.CONNECTED, 'xvdb'])
})

it('hides the device row without a VBD', () => {
  expect(Object.keys(findCardLabelledValues(mountCard()))).toEqual([t('description'), t('tags'), t('status')])
})

it('links the title to the VDI page in the VM context when shown with a VBD', () => {
  const wrapper = mountCard(createVdi({ id: 'vdi-1' as FrontXoVdi['id'] }), createVbd())

  expect(wrapper.getComponent(UiPanelCardTitle).get('a').attributes('href')).toBe('/vdi/vdi-1/general?from=vm')
})

it('links the title to the VDI page in the SR context without a VBD', () => {
  const wrapper = mountCard(createVdi({ id: 'vdi-1' as FrontXoVdi['id'] }))

  expect(wrapper.getComponent(UiPanelCardTitle).get('a').attributes('href')).toBe('/vdi/vdi-1/general?from=sr')
})

describe('status', () => {
  it('is connected, with the attached icon, when every VBD of the VDI is attached', () => {
    getVbdsByIds.mockReturnValue([createVbd({ attached: true }), createVbd({ attached: true })])

    const wrapper = mountCard()

    expect(findCardLabelledValues(wrapper)[t('status')]).toBe(t('connected'))
    expect(wrapper.getComponent(UiPanelCardTitle).props('icon')).toBe('object:vdi:attached')
  })

  it('is partially connected, with the warning icon, when only some VBDs of the VDI are attached', () => {
    getVbdsByIds.mockReturnValue([createVbd({ attached: true }), createVbd({ attached: false })])

    const wrapper = mountCard()

    expect(findCardLabelledValues(wrapper)[t('status')]).toBe(t('partially-connected'))
    expect(wrapper.getComponent(UiPanelCardTitle).props('icon')).toBe('object:vdi:warning')
  })

  it('is disconnected, with the detached icon, when no VBD of the VDI is attached', () => {
    getVbdsByIds.mockReturnValue([createVbd({ attached: false })])

    const wrapper = mountCard()

    expect(findCardLabelledValues(wrapper)[t('status')]).toBe(t('disconnected'))
    expect(wrapper.getComponent(UiPanelCardTitle).props('icon')).toBe('object:vdi:detached')
  })

  it('is disconnected, with the detached icon, for a VDI with no VBD', () => {
    const wrapper = mountCard()

    expect(findCardLabelledValues(wrapper)[t('status')]).toBe(t('disconnected'))
    expect(wrapper.getComponent(UiPanelCardTitle).props('icon')).toBe('object:vdi:detached')
  })
})
