import V2vSourceSnapshotChangedInfo from '@/modules/v2v/components/mapping/V2vSourceSnapshotChangedInfo.vue'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import { findAccentedInfos } from '@core-test/find-accented-labels.ts'
import { mount } from '@vue/test-utils'

it('warns a source snapshot changed since the last sync makes a new VM', () => {
  const wrapper = mount(V2vSourceSnapshotChangedInfo, { global: createGlobalTestConfig() })

  expect(findAccentedInfos(wrapper)).toEqual([{ label: t('v2v:source-snapshot-changed-info'), accent: 'warning' }])
})
