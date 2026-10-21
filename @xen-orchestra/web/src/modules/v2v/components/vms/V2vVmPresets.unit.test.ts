import V2vVmPresets from '@/modules/v2v/components/vms/V2vVmPresets.vue'
import type { V2vVmPreset } from '@/modules/v2v/composables/use-v2v-vms-step.composable.ts'
import { getButtonByLabel } from '@/test/find-button.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import UiButton from '@core/components/ui/button/UiButton.vue'
import { mount } from '@vue/test-utils'

const PRESETS: V2vVmPreset[] = [
  { id: 'all', label: t('all'), count: 148, isActive: false },
  { id: 'not-migrated', label: t('not-migrated'), count: 96, isActive: true },
  { id: 'warm', label: t('v2v:status:warm'), count: 0, isActive: false },
]

function mountPresets() {
  return mount(V2vVmPresets, { props: { presets: PRESETS }, global: createGlobalTestConfig() })
}

function findButtons(wrapper: ReturnType<typeof mountPresets>) {
  return wrapper.findAllComponents(UiButton)
}

it('offers each preset with its count, in order', () => {
  expect(findButtons(mountPresets()).map(button => button.text())).toEqual([
    t('label-with-count', { label: t('all'), count: 148 }),
    t('label-with-count', { label: t('not-migrated'), count: 96 }),
    t('label-with-count', { label: t('v2v:status:warm'), count: 0 }),
  ])
})

it('fills the active preset only', () => {
  expect(findButtons(mountPresets()).map(button => button.props('variant'))).toEqual([
    'secondary',
    'primary',
    'secondary',
  ])
})

it('applies the preset clicked', async () => {
  const wrapper = mountPresets()

  await getButtonByLabel(wrapper, t('label-with-count', { label: t('v2v:status:warm'), count: 0 })).trigger('click')

  expect(wrapper.emitted('apply')).toEqual([['warm']])
})
