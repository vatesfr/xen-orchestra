import StorageRepositoryCustomFields from '@/modules/storage-repository/components/general/StorageRepositoryCustomFields.vue'
import { createSr } from '@/test/create-sr.ts'
import { findLabelledValues } from '@/test/find-labelled-values.ts'
import { findStateHeroText, hasStateHero } from '@/test/find-state-hero.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import { mount } from '@vue/test-utils'

function mountCustomFields(otherConfig: Record<string, string>) {
  return mount(StorageRepositoryCustomFields, {
    props: { sr: createSr({ other_config: otherConfig }) },
    global: createGlobalTestConfig(),
  })
}

it('lists every custom field of the SR under its own name', () => {
  const wrapper = mountCustomFields({
    'XenCenter.CustomFields.owner': 'Infra team',
    'XenCenter.CustomFields.rack': 'B12',
  })

  expect(findLabelledValues(wrapper)).toEqual({ owner: 'Infra team', rack: 'B12' })
})

it('leaves out the other config entries that are not custom fields', () => {
  const wrapper = mountCustomFields({ 'XenCenter.CustomFields.owner': 'Infra team', auto_poweron: 'true' })

  expect(findLabelledValues(wrapper)).toEqual({ owner: 'Infra team' })
})

it('says no custom field was detected when the SR carries none', () => {
  const wrapper = mountCustomFields({ auto_poweron: 'true' })

  expect(findStateHeroText(wrapper)).toBe(t('no-custom-field-detected'))
  expect(findLabelledValues(wrapper)).toEqual({})
})

it('shows the custom fields rather than the no-data hero as soon as there is one', () => {
  const wrapper = mountCustomFields({ 'XenCenter.CustomFields.owner': 'Infra team' })

  expect(hasStateHero(wrapper)).toBe(false)
})
