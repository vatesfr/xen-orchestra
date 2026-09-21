import type { useXoHostCollection } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import type { FrontXoPbd, useXoPbdCollection } from '@/modules/pbd/remote-resources/use-xo-pbd-collection.ts'
import type { FrontXoSm, useXoSmCollection } from '@/modules/sm/remote-resources/use-xo-sm-collection.ts'
import StorageRepositoryGeneralInformation from '@/modules/storage-repository/components/general/StorageRepositoryGeneralInformation.vue'
import type { FrontXoSr } from '@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'
import { createPbd } from '@/test/create-pbd.ts'
import { createSm } from '@/test/create-sm.ts'
import { createSr } from '@/test/create-sr.ts'
import { findLabelledValues } from '@/test/find-labelled-values.ts'
import { findTagLabels } from '@/test/find-tags.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import { mount } from '@vue/test-utils'
import { ref } from 'vue'

// Read only when the component mounts, so the module-scope refs are already initialized
const pbdsInSr = ref<FrontXoPbd[]>([])
const arePbdsReady = ref(true)
const sms = ref<FrontXoSm[]>([])
const areSmsReady = ref(true)

vi.mock(import('@/modules/pbd/remote-resources/use-xo-pbd-collection.ts'), () => ({
  useXoPbdCollection: (() => ({
    getPbdsByIds: () => pbdsInSr.value,
    pbdsBySr: ref(new Map()),
    arePbdsReady,
  })) as unknown as typeof useXoPbdCollection,
}))

vi.mock(import('@/modules/host/remote-resources/use-xo-host-collection.ts'), () => ({
  useXoHostCollection: (() => ({ getHostById: () => undefined })) as unknown as typeof useXoHostCollection,
}))

vi.mock(import('@/modules/sm/remote-resources/use-xo-sm-collection.ts'), () => ({
  useXoSmCollection: (() => ({ sms, areSmsReady })) as unknown as typeof useXoSmCollection,
}))

beforeEach(() => {
  pbdsInSr.value = []
  arePbdsReady.value = true
  sms.value = []
  areSmsReady.value = true
})

function mountGeneralInformation(overrides: Partial<FrontXoSr> = {}) {
  return mount(StorageRepositoryGeneralInformation, {
    props: { sr: createSr(overrides) },
    global: createGlobalTestConfig(),
  })
}

it('shows what the SR is', () => {
  const wrapper = mountGeneralInformation({
    id: 'sr-42' as FrontXoSr['id'],
    name_label: 'Local storage',
    name_description: 'On the primary host',
    SR_type: 'lvm',
    shared: false,
    allocationStrategy: 'thin',
  })

  expect(findLabelledValues(wrapper)).toEqual({
    [t('name')]: 'Local storage',
    [t('uuid')]: 'sr-42',
    [t('description')]: 'On the primary host',
    [t('tags')]: '',
    [t('status')]: t('disconnected'),
    [t('storage-format')]: 'lvm',
    [t('supported-image-formats')]: 'VHD',
    [t('access-mode')]: t('local'),
    [t('provisioning')]: 'thin',
  })
})

it('lists the tags of the SR', () => {
  const wrapper = mountGeneralInformation({ tags: ['production', 'ssd'] })

  expect(findTagLabels(wrapper)).toEqual(['production', 'ssd'])
})

it('lists no tag for an untagged SR', () => {
  const wrapper = mountGeneralInformation({ tags: [] })

  expect(findTagLabels(wrapper)).toEqual([])
})

it('reports the SR as connected while its PBDs are plugged in', () => {
  pbdsInSr.value = [createPbd({ attached: true })]

  const wrapper = mountGeneralInformation()

  expect(findLabelledValues(wrapper)[t('status')]).toBe(t('connected'))
})

it('reports the SR as partially connected while only some of its PBDs are plugged in', () => {
  pbdsInSr.value = [
    createPbd({ id: 'pbd-1' as FrontXoPbd['id'], attached: true }),
    createPbd({ id: 'pbd-2' as FrontXoPbd['id'], attached: false }),
  ]

  const wrapper = mountGeneralInformation()

  expect(findLabelledValues(wrapper)[t('status')]).toBe(t('partially-connected'))
})

it('leaves the status blank while the PBDs are still loading', () => {
  arePbdsReady.value = false
  pbdsInSr.value = [createPbd({ attached: true })]

  const wrapper = mountGeneralInformation()

  expect(findLabelledValues(wrapper)[t('status')]).toBe('')
})

it('reports a shared SR as shared', () => {
  const wrapper = mountGeneralInformation({ shared: true })

  expect(findLabelledValues(wrapper)[t('access-mode')]).toBe(t('shared'))
})

it('reports an unknown provisioning when the SR declares no allocation strategy', () => {
  const wrapper = mountGeneralInformation({ allocationStrategy: undefined })

  expect(findLabelledValues(wrapper)[t('provisioning')]).toBe(t('unknown'))
})

it('lists the image formats the storage manager of the SR supports', () => {
  sms.value = [createSm({ supported_image_formats: ['vhd', 'qcow2'] })]

  const wrapper = mountGeneralInformation({ SR_type: 'lvm' })

  expect(findLabelledValues(wrapper)[t('supported-image-formats')]).toBe('VHD, QCOW2')
})

it('falls back to VHD when the storage manager lists no image format', () => {
  sms.value = [createSm({ supported_image_formats: [] })]

  const wrapper = mountGeneralInformation({ SR_type: 'lvm' })

  expect(findLabelledValues(wrapper)[t('supported-image-formats')]).toBe('VHD')
})

it('ignores the storage manager of another storage type', () => {
  sms.value = [createSm({ SM_type: 'nfs', supported_image_formats: ['qcow2'] })]

  const wrapper = mountGeneralInformation({ SR_type: 'lvm' })

  expect(findLabelledValues(wrapper)[t('supported-image-formats')]).toBe('VHD')
})

it('ignores the storage manager of another pool', () => {
  sms.value = [createSm({ $pool: 'pool-other' as FrontXoSm['$pool'], supported_image_formats: ['qcow2'] })]

  const wrapper = mountGeneralInformation({ SR_type: 'lvm' })

  expect(findLabelledValues(wrapper)[t('supported-image-formats')]).toBe('VHD')
})

it('leaves the image formats blank while the storage managers are still loading', () => {
  areSmsReady.value = false
  sms.value = [createSm({ supported_image_formats: ['qcow2'] })]

  const wrapper = mountGeneralInformation({ SR_type: 'lvm' })

  expect(findLabelledValues(wrapper)[t('supported-image-formats')]).toBe('')
})
