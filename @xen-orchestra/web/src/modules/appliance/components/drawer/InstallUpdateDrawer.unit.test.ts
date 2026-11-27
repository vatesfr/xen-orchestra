import InstallUpdateDrawer from '@/modules/appliance/components/drawer/InstallUpdateDrawer.vue'
import { XO_LINKS } from '@/shared/constants.ts'
import { cancelDrawer, findDrawerButtonLabels, submitDrawer } from '@/test/drawer.ts'
import { findLabelledValues } from '@/test/find-rendered-values.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import { findLinks } from '@core-test/find-links.ts'
import { mount } from '@vue/test-utils'

type InstallUpdateDrawerProps = {
  channel: string
  currentVersion?: string
  nextVersion?: string
}

const VERSIONS: InstallUpdateDrawerProps = { channel: 'stable', currentVersion: '5.100.0', nextVersion: '5.101.0' }

function mountDrawer(props: Partial<InstallUpdateDrawerProps> = {}) {
  return mount(InstallUpdateDrawer, {
    props: { ...VERSIONS, ...props },
    global: createGlobalTestConfig(),
    attachTo: document.body,
  })
}

describe('title', () => {
  it('names the version to install', () => {
    expect(mountDrawer().get('.ui-drawer .header').text()).toBe(t('appliance:install-version', { version: '5.101.0' }))
  })

  it('stays generic while the next version is unknown', () => {
    expect(mountDrawer({ nextVersion: undefined }).get('.ui-drawer .header').text()).toBe(t('action:install-update'))
  })
})

describe('summary', () => {
  it('shows the installed version, the new one and the channel', () => {
    expect(findLabelledValues(mountDrawer())).toEqual({
      [t('appliance:installed-version')]: '5.100.0',
      [t('appliance:new-version')]: '5.101.0',
      [t('appliance:release-channel')]: 'stable',
    })
  })

  it('links to what is new in the next version', () => {
    expect(findLinks(mountDrawer())).toEqual([
      [t('appliance:whats-new-in', { version: '5.101.0' }), XO_LINKS.CHANGELOG],
    ])
  })

  it('offers no link while the next version is unknown', () => {
    expect(findLinks(mountDrawer({ nextVersion: undefined }))).toEqual([])
  })
})

it('offers to cancel or to install the update', () => {
  expect(findDrawerButtonLabels(mountDrawer())).toEqual([t('cancel'), t('action:install-update')])
})

it('cancels from the cancel button', async () => {
  const wrapper = mountDrawer()

  await cancelDrawer(wrapper)

  expect(wrapper.emitted('cancel')).toHaveLength(1)
  expect(wrapper.emitted('confirm')).toBeUndefined()
})

it('confirms with a snapshot by default', async () => {
  const wrapper = mountDrawer()

  await submitDrawer(wrapper)

  expect(wrapper.emitted('confirm')).toEqual([[{ snapshot: true }]])
})

it('confirms without snapshot once unchecked', async () => {
  const wrapper = mountDrawer()
  await wrapper.get('.ui-rich-checkbox input[type="checkbox"]').setValue(false)

  await submitDrawer(wrapper)

  expect(wrapper.emitted('confirm')).toEqual([[{ snapshot: false }]])
})
