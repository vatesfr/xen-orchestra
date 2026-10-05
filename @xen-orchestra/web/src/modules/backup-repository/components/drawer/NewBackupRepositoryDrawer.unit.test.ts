import NewBackupRepositoryDrawer from '@/modules/backup-repository/components/drawer/NewBackupRepositoryDrawer.vue'
import BackupRepositoryDetailsStep from '@/modules/backup-repository/components/form/steps/BackupRepositoryDetailsStep.vue'
import BackupRepositoryGeneralStep from '@/modules/backup-repository/components/form/steps/BackupRepositoryGeneralStep.vue'
import NewBackupRepositoryReviewStep from '@/modules/backup-repository/components/form/steps/NewBackupRepositoryReviewStep.vue'
import type { useXoProxyCollection } from '@/modules/proxy/remote-resources/use-xo-proxy-collection.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { computed, ref } from 'vue'

vi.mock(import('@/modules/proxy/remote-resources/use-xo-proxy-collection.ts'), () => ({
  useXoProxyCollection: (() => ({
    proxies: ref([]),
    useGetProxyById: () => computed(() => undefined),
  })) as unknown as typeof useXoProxyCollection,
}))

const STEPS = {
  general: BackupRepositoryGeneralStep,
  details: BackupRepositoryDetailsStep,
  review: NewBackupRepositoryReviewStep,
}

async function mountDrawer() {
  const wrapper = mount(NewBackupRepositoryDrawer, { global: createGlobalTestConfig(), attachTo: document.body })
  await flushPromises()

  return wrapper
}

function findRenderedSteps(wrapper: VueWrapper) {
  return (Object.keys(STEPS) as (keyof typeof STEPS)[]).filter(step => wrapper.findComponent(STEPS[step]).exists())
}

function findButtonLabels(wrapper: VueWrapper) {
  return wrapper.findAll('.buttons button').map(button => button.text())
}

function getField(wrapper: VueWrapper, label: string) {
  const field = wrapper.findAll('.vts-input-wrapper').find(field => field.get('.ui-label').text().includes(label))

  if (field === undefined) {
    throw new Error(`No field labelled "${label}"`)
  }

  return field
}

async function fill(wrapper: VueWrapper, label: string, value: string) {
  await getField(wrapper, label).get('input').setValue(value)
}

async function select(wrapper: VueWrapper, label: string, optionLabel: string) {
  await getField(wrapper, label).get('.vts-select .ui-input').trigger('click')
  await flushPromises()

  const option = wrapper.findAll('.ui-dropdown').find(option => option.text().startsWith(optionLabel))

  if (option === undefined) {
    throw new Error(`No option "${optionLabel}" in the select labelled "${label}"`)
  }

  await option.trigger('click')
  await flushPromises()
}

async function submit(wrapper: VueWrapper) {
  await wrapper.get('form').trigger('submit')
  await flushPromises()
}

async function clickButton(wrapper: VueWrapper, label: string) {
  const button = wrapper.findAll('.buttons button').find(button => button.text() === label)

  if (button === undefined) {
    throw new Error(`No button "${label}"`)
  }

  await button.trigger('click')
  await flushPromises()
}

async function mountDrawerAtDetailsStep() {
  const wrapper = await mountDrawer()
  await fill(wrapper, t('name'), 'My repository')
  await select(wrapper, t('type'), t('nfs'))
  await select(wrapper, t('backup-format'), t('vhd-file'))
  await submit(wrapper)

  return wrapper
}

async function mountDrawerAtReviewStep() {
  const wrapper = await mountDrawerAtDetailsStep()
  await fill(wrapper, t('host-or-ip-address'), '192.168.1.10')
  await fill(wrapper, t('path-on-share'), '/exports/backups')
  await submit(wrapper)

  return wrapper
}

it.each([
  ['general', mountDrawer],
  ['details', mountDrawerAtDetailsStep],
] as const)('stays on the %s step when it is submitted while invalid', async (step, mountDrawerAtStep) => {
  const wrapper = await mountDrawerAtStep()

  await submit(wrapper)

  expect(findRenderedSteps(wrapper)).toEqual([step])
})

describe('general step', () => {
  it('is the first step, offering to cancel or to continue', async () => {
    const wrapper = await mountDrawer()

    expect(findRenderedSteps(wrapper)).toEqual(['general'])
    expect(findButtonLabels(wrapper)).toEqual([t('cancel'), t('action:continue')])
  })

  it('cancels from the cancel button', async () => {
    const wrapper = await mountDrawer()

    await clickButton(wrapper, t('cancel'))

    expect(wrapper.emitted('cancel')).toHaveLength(1)
  })
})

describe('details step', () => {
  it('follows a valid general step, offering to go back or to continue', async () => {
    const wrapper = await mountDrawerAtDetailsStep()

    expect(findRenderedSteps(wrapper)).toEqual(['details'])
    expect(findButtonLabels(wrapper)).toEqual([t('action:back'), t('action:continue')])
  })

  it('goes back to the general step, without cancelling', async () => {
    const wrapper = await mountDrawerAtDetailsStep()

    await clickButton(wrapper, t('action:back'))

    expect(findRenderedSteps(wrapper)).toEqual(['general'])
    expect(wrapper.emitted('cancel')).toBeUndefined()
  })
})

describe('review step', () => {
  it('follows valid details, offering to go back or to create', async () => {
    const wrapper = await mountDrawerAtReviewStep()

    expect(findRenderedSteps(wrapper)).toEqual(['review'])
    expect(findButtonLabels(wrapper)).toEqual([t('action:back'), t('action:create')])
  })

  it('does not confirm before it is submitted', async () => {
    const wrapper = await mountDrawerAtReviewStep()

    expect(wrapper.emitted('confirm')).toBeUndefined()
  })

  it('confirms with the repository to create when it is submitted', async () => {
    const wrapper = await mountDrawerAtReviewStep()

    await submit(wrapper)

    expect(wrapper.emitted('confirm')).toEqual([[{ name: 'My repository', url: expect.any(String) }]])
  })

  it('goes back to the step a section asks to edit', async () => {
    const wrapper = await mountDrawerAtReviewStep()

    await wrapper.get('.section .ui-title button').trigger('click')

    expect(findRenderedSteps(wrapper)).toEqual(['general'])
  })
})
