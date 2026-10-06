import PoolSystemGeneralInfo from '@/modules/pool/components/system/PoolSystemGeneralInfo.vue'
import type { FrontXoPool } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import { createPool } from '@/test/create-pool.ts'
import { findCopiedValues } from '@/test/find-labelled-values.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import { mount } from '@vue/test-utils'

it('offers to copy the name and the UUID of the pool', () => {
  const wrapper = mount(PoolSystemGeneralInfo, {
    props: { pool: createPool({ name_label: 'Production Pool', id: 'pool-42' as FrontXoPool['id'] }) },
    global: createGlobalTestConfig(),
  })

  expect(findCopiedValues(wrapper)).toEqual({ [t('name')]: 'Production Pool', [t('uuid')]: 'pool-42' })
})
