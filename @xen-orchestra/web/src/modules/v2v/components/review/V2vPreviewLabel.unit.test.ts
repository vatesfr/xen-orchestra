import V2vPreviewLabel from '@/modules/v2v/components/review/V2vPreviewLabel.vue'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import { findAccentedTags } from '@core-test/find-accented-labels.ts'
import { mount } from '@vue/test-utils'

function mountLabel() {
  return mount(V2vPreviewLabel, {
    slots: { default: 'Clean up' },
    global: createGlobalTestConfig(),
  })
}

it('shows its content followed by the preview tag', () => {
  expect(mountLabel().text()).toBe(`Clean up${t('preview')}`)
})

it('tags its content as a preview with the warning accent', () => {
  expect(findAccentedTags(mountLabel())).toEqual([{ label: t('preview'), accent: 'warning' }])
})
