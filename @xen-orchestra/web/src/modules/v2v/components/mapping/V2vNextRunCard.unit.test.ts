import V2vNextRunCard from '@/modules/v2v/components/mapping/V2vNextRunCard.vue'
import V2vSourceSnapshotChangedInfo from '@/modules/v2v/components/mapping/V2vSourceSnapshotChangedInfo.vue'
import { findCardLabelledValues } from '@/test/find-rendered-values.ts'
import { findPanelCardTitleLabel } from '@/test/find-titles.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import { formatDateTime } from '@core/utils/time.util.ts'
import { findAccentedInfos } from '@core-test/find-accented-labels.ts'
import { mount } from '@vue/test-utils'

const LAST_SYNC_AT = Date.UTC(2026, 9, 2, 14, 40)

// An explicit `lastSyncAt: undefined` stands for a VM without last sync
function mountCard(props: { lastSyncAt?: number } = {}) {
  return mount(V2vNextRunCard, {
    props: { lastSyncAt: LAST_SYNC_AT, ...props },
    global: createGlobalTestConfig({ stubs: { V2vSourceSnapshotChangedInfo: true } }),
  })
}

it('shows its title', () => {
  expect(findPanelCardTitleLabel(mountCard())).toBe(t('next-run'))
})

it('tells when the VM was last synced', () => {
  expect(findCardLabelledValues(mountCard())).toEqual({ [t('last-sync')]: formatDateTime(LAST_SYNC_AT) })
})

it('leaves the last sync empty for a VM without one', () => {
  expect(findCardLabelledValues(mountCard({ lastSyncAt: undefined }))[t('last-sync')]).toBe('')
})

it('warns a source snapshot changed since the last sync makes a new VM', () => {
  expect(mountCard().findComponent(V2vSourceSnapshotChangedInfo).exists()).toBe(true)
})

it('reminds to sync shortly before the cutover', () => {
  expect(findAccentedInfos(mountCard())).toEqual([{ label: t('v2v:next-run-reminder'), accent: 'info' }])
})
