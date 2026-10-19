import V2vRememberedConnectionsCard from '@/modules/v2v/components/source/V2vRememberedConnectionsCard.vue'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import { mount } from '@vue/test-utils'

function mountCard() {
  return mount(V2vRememberedConnectionsCard, {
    slots: { default: '<p class="slotted">Slotted content</p>' },
    global: createGlobalTestConfig(),
  })
}

it('shows its title and where the connections are stored', () => {
  expect(mountCard().getComponent(UiCardTitle).text()).toBe(
    `${t('remembered-connections')} ${t('stored-in-browser-only')}`
  )
})

it('shows the content it is given', () => {
  expect(mountCard().get('.slotted').text()).toBe('Slotted content')
})

it('reminds that credentials are never stored by XO', () => {
  expect(mountCard().text()).toContain(t('v2v:credentials-never-stored'))
})
