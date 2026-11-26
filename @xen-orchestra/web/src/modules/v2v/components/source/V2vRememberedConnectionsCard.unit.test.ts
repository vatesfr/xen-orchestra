import V2vRememberedConnectionsCard from '@/modules/v2v/components/source/V2vRememberedConnectionsCard.vue'
import { itRendersCardTitle } from '@/test/card-title.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import { mount } from '@vue/test-utils'

function mountCard() {
  return mount(V2vRememberedConnectionsCard, {
    slots: { default: 'Slotted content' },
    global: createGlobalTestConfig(),
  })
}

itRendersCardTitle(mountCard, `${t('remembered-connections')} ${t('stored-in-browser-only')}`)

it('shows the content it is given', () => {
  expect(mountCard().text()).toContain('Slotted content')
})

it('reminds that credentials are never stored by XO', () => {
  expect(mountCard().text()).toContain(t('v2v:credentials-never-stored'))
})
