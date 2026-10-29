import type { FrontXoVbd, useXoVbdCollection } from '@/modules/vbd/remote-resources/use-xo-vbd-collection.ts'
import VdiInfosSidepanelCard from '@/modules/vdi/components/list/panel/cards/VdiInfosSidepanelCard.vue'
import type { FrontXoVdi } from '@/modules/vdi/remote-resources/use-xo-vdi-collection.ts'
import { VDI_PAGE_CONTEXT, type VdiPageContext } from '@/shared/constants.ts'
import { createVbd } from '@/test/create-vbd.ts'
import { createVdi } from '@/test/create-vdi.ts'
import { findCardCopiedValues, findCardLabelledValues } from '@/test/find-rendered-values.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import UiLink from '@core/components/ui/link/UiLink.vue'
import { objectIcon } from '@core/icons'
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

const vdi = createVdi({
  id: 'vdi-42' as FrontXoVdi['id'],
  name_label: 'System disk',
  name_description: 'Root filesystem',
  tags: ['production'],
})

function mountCard(fromContext: VdiPageContext, vbd?: FrontXoVbd, cardVdi: FrontXoVdi = vdi) {
  return mount(VdiInfosSidepanelCard, {
    props: { vdi: cardVdi, vbd, fromContext },
    global: createGlobalTestConfig(),
  })
}

function attachVbds(...attached: boolean[]) {
  getVbdsByIds.mockReturnValue(attached.map(isAttached => createVbd({ attached: isAttached })))
}

function findTitleLink(wrapper: ReturnType<typeof mountCard>) {
  return wrapper.get('.ui-panel-card-title').getComponent(UiLink)
}

it('titles the card with the name of the VDI', () => {
  expect(findTitleLink(mountCard(VDI_PAGE_CONTEXT.VM)).text()).toBe('System disk')
})

it.each([VDI_PAGE_CONTEXT.VM, VDI_PAGE_CONTEXT.SR])(
  'links the title to the VDI page, opened from the %s',
  fromContext => {
    expect(findTitleLink(mountCard(fromContext)).attributes('href')).toBe(`/vdi/vdi-42/general?from=${fromContext}`)
  }
)

it.each([
  { attached: [true, true], icon: objectIcon('vdi', 'attached'), status: CONNECTION_STATUS.CONNECTED },
  { attached: [true, false], icon: objectIcon('vdi', 'warning'), status: CONNECTION_STATUS.PARTIALLY_CONNECTED },
  { attached: [false, false], icon: objectIcon('vdi', 'detached'), status: CONNECTION_STATUS.DISCONNECTED },
  { attached: [], icon: objectIcon('vdi', 'detached'), status: CONNECTION_STATUS.DISCONNECTED },
])('shows the $status icon and status when its VBDs are $attached', ({ attached, icon, status }) => {
  attachVbds(...attached)

  const wrapper = mountCard(VDI_PAGE_CONTEXT.SR)

  expect(findTitleLink(wrapper).props('icon')).toBe(icon)
  expect(findCardLabelledValues(wrapper)).toMatchObject({ [t('status')]: t(status) })
})

describe('from a VM', () => {
  it('shows the description, the tags, the status and the device of the VDI', () => {
    attachVbds(true)

    const wrapper = mountCard(VDI_PAGE_CONTEXT.VM, createVbd({ device: 'xvdb' }))

    expect(findCardLabelledValues(wrapper)).toEqual({
      [t('description')]: 'Root filesystem',
      [t('tags')]: 'production',
      [t('status')]: t('connected'),
      [t('device')]: 'xvdb',
    })
    expect(findCardCopiedValues(wrapper)).toEqual([
      'Root filesystem',
      'production',
      CONNECTION_STATUS.CONNECTED,
      'xvdb',
    ])
  })

  it('leaves the device empty and uncopyable without a VBD', () => {
    const wrapper = mountCard(VDI_PAGE_CONTEXT.VM)

    expect(findCardLabelledValues(wrapper)).toMatchObject({ [t('device')]: '' })
    expect(findCardCopiedValues(wrapper)).toEqual(['Root filesystem', 'production', CONNECTION_STATUS.DISCONNECTED])
  })
})

describe('from an SR', () => {
  it('does not show the device', () => {
    const wrapper = mountCard(VDI_PAGE_CONTEXT.SR, createVbd({ device: 'xvdb' }))

    expect(Object.keys(findCardLabelledValues(wrapper))).toEqual([t('description'), t('tags'), t('status')])
  })
})

it('offers nothing to copy for an empty description or no tag', () => {
  const wrapper = mountCard(VDI_PAGE_CONTEXT.SR, undefined, createVdi({ name_description: '', tags: [] }))

  expect(findCardCopiedValues(wrapper)).toEqual([CONNECTION_STATUS.DISCONNECTED])
})
