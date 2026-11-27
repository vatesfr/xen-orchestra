import ApplianceEditProxyButton from '@/modules/appliance/components/actions/edit-proxy/ApplianceEditProxyButton.vue'
import ApplianceNewProxyButton from '@/modules/appliance/components/actions/new-proxy/ApplianceNewProxyButton.vue'
import ApplianceConnectionCard from '@/modules/appliance/components/connection/ApplianceConnectionCard.vue'
import type { XoaProxy } from '@/modules/appliance/types/xoa-proxy.type.ts'
import { findCardTitleLabel } from '@/test/find-card-title.ts'
import { findLabelledValues } from '@/test/find-rendered-values.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import { formatDateTime } from '@core/utils/time.util.ts'
import { findAccentedInfos } from '@core-test/find-accented-labels.ts'
import { mount } from '@vue/test-utils'

const PROXY: XoaProxy = { host: 'proxy.example.org', port: 3128 }

const LAST_REACHED_AT = Date.UTC(2026, 10, 26, 8, 15)

type ConnectionCardProps = {
  proxy?: XoaProxy
  reachable?: boolean
  lastReachedAt?: number
}

// The proxy buttons run their own jobs, covered by their own test
function mountCard(props: ConnectionCardProps = {}) {
  return mount(ApplianceConnectionCard, {
    props,
    global: createGlobalTestConfig({ stubs: { ApplianceNewProxyButton: true, ApplianceEditProxyButton: true } }),
  })
}

function findHint(props: ConnectionCardProps) {
  const hint = mountCard(props).find('.hint')

  if (!hint.exists()) {
    return undefined
  }

  return hint.text()
}

it('shows its title', () => {
  expect(findCardTitleLabel(mountCard())).toBe(t('appliance:connection-to-vates'))
})

describe('proxy', () => {
  it('tells there is no proxy, and offers to set one', () => {
    const wrapper = mountCard()

    expect(findLabelledValues(wrapper)[t('proxy')]).toBe(t('appliance:no-proxy'))
    expect(wrapper.findComponent(ApplianceNewProxyButton).exists()).toBe(true)
    expect(wrapper.findComponent(ApplianceEditProxyButton).exists()).toBe(false)
  })

  it('shows the address of the proxy, and offers to edit it', () => {
    const wrapper = mountCard({ proxy: PROXY })

    expect(findLabelledValues(wrapper)[t('proxy')]).toBe('proxy.example.org:3128')
    expect(wrapper.getComponent(ApplianceEditProxyButton).props('proxy')).toEqual(PROXY)
    expect(wrapper.findComponent(ApplianceNewProxyButton).exists()).toBe(false)
  })
})

describe('Vates servers', () => {
  it('shows no state while it is unknown', () => {
    expect(findAccentedInfos(mountCard())).toEqual([])
  })

  it('tells the servers are unreachable', () => {
    expect(findAccentedInfos(mountCard({ reachable: false }))).toEqual([
      { label: t('appliance:unreachable'), accent: 'danger' },
    ])
  })

  it('tells the servers are reachable', () => {
    expect(findAccentedInfos(mountCard({ reachable: true }))).toEqual([
      { label: t('appliance:reachable'), accent: 'success' },
    ])
  })

  it('tells the servers are reachable through the proxy', () => {
    expect(findAccentedInfos(mountCard({ reachable: true, proxy: PROXY }))).toEqual([
      { label: t('appliance:reachable-through-proxy'), accent: 'success' },
    ])
  })
})

describe('hint', () => {
  it('suggests setting a proxy when the servers are unreachable without one', () => {
    expect(findHint({ reachable: false })).toBe(t('appliance:set-proxy-hint'))
  })

  it('tells when the servers were last reached', () => {
    expect(findHint({ reachable: false, lastReachedAt: LAST_REACHED_AT })).toBe(
      `${t('appliance:last-reached', { date: formatDateTime(LAST_REACHED_AT) })} ${t('appliance:set-proxy-hint')}`
    )
  })

  it('suggests nothing while the servers state is unknown', () => {
    expect(findHint({})).toBeUndefined()
  })

  it('suggests nothing when the servers are reachable', () => {
    expect(findHint({ reachable: true })).toBeUndefined()
  })

  it('suggests nothing when a proxy is already set', () => {
    expect(findHint({ reachable: false, proxy: PROXY })).toBeUndefined()
  })
})
