import V2vPrerequisiteStatus from '@/modules/v2v/components/source/V2vPrerequisiteStatus.vue'
import type { V2vPrerequisiteState } from '@/modules/v2v/utils/v2v-prerequisite.util.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import { findAccentedInfos } from '@core-test/find-accented-labels.ts'
import { mount } from '@vue/test-utils'

function mountStatus(prerequisite: V2vPrerequisiteState) {
  return mount(V2vPrerequisiteStatus, { props: { prerequisite }, global: createGlobalTestConfig() })
}

it.each([
  [{ state: 'checking' }, 'info', t('v2v:prerequisite-checking')],
  [{ state: 'ok' }, 'success', t('v2v:prerequisite-ok')],
  [{ state: 'error', error: undefined }, 'danger', t('v2v:prerequisite-error')],
  [
    { state: 'error', error: 'glibc too old' },
    'danger',
    t('v2v:prerequisite-error-detail', { error: 'glibc too old' }),
  ],
] satisfies [V2vPrerequisiteState, string, string][])('shows %j as a %s message', (prerequisite, accent, message) => {
  expect(findAccentedInfos(mountStatus(prerequisite))).toEqual([{ label: message, accent }])
})
