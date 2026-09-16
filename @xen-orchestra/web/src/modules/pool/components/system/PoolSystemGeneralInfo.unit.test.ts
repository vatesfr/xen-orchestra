import PoolSystemGeneralInfo from '@/modules/pool/components/system/PoolSystemGeneralInfo.vue'
import type { FrontXoPool } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import { createPool } from '@/test/create-pool.ts'
import { findLabelledValues } from '@/test/find-labelled-values.ts'
import { findTagLabels } from '@/test/find-tags.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import { mount } from '@vue/test-utils'

function mountGeneralInfo(pool: FrontXoPool = createPool()) {
  return mount(PoolSystemGeneralInfo, {
    props: { pool },
    global: createGlobalTestConfig(),
  })
}

function mountTags(tags: string[]) {
  const wrapper = mountGeneralInfo(createPool({ tags }))

  return findTagLabels(wrapper)
}

it('renders the card title', () => {
  const wrapper = mountGeneralInfo()

  expect(wrapper.get('.ui-title').text()).toBe(t('general-information'))
})

it('shows the name, uuid and description of the pool', () => {
  const pool = createPool({
    id: 'pool-1' as FrontXoPool['id'],
    name_label: 'Production',
    name_description: 'The production pool',
  })

  expect(findLabelledValues(mountGeneralInfo(pool))).toEqual({
    [t('name')]: 'Production',
    [t('uuid')]: 'pool-1',
    [t('description')]: 'The production pool',
    [t('tags')]: '',
  })
})

it('lists every tag of the pool', () => {
  expect(mountTags(['production', 'critical'])).toEqual(['production', 'critical'])
})

it('shows no tag when the pool has none', () => {
  expect(mountTags([])).toEqual([])
})
