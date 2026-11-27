import NewBackupRepositoryDrawer from '@/modules/backup-repository/components/drawer/NewBackupRepositoryDrawer.vue'
import BackupRepositoryDetailsStep from '@/modules/backup-repository/components/form/steps/BackupRepositoryDetailsStep.vue'
import BackupRepositoryGeneralStep from '@/modules/backup-repository/components/form/steps/BackupRepositoryGeneralStep.vue'
import NewBackupRepositoryReviewStep from '@/modules/backup-repository/components/form/steps/NewBackupRepositoryReviewStep.vue'
import { findDrawerButtonLabels, submitDrawer } from '@/test/drawer.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import { proxyCollectionMock, mockXoProxyCollection } from '@/test/mock-xo-proxy-collection.ts'
import { getButton } from '@core-test/get-button.ts'
import { chooseSelectOption } from '@core-test/select.ts'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'

mockXoProxyCollection()

beforeEach(() => {
  proxyCollectionMock.reset()
})

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

async function clickButton(wrapper: VueWrapper, label: string) {
  await getButton(wrapper, label).trigger('click')
  await flushPromises()
}

async function mountDrawerAtDetailsStep() {
  const wrapper = await mountDrawer()
  await fill(wrapper, t('name'), 'My repository')
  await chooseSelectOption(wrapper, t('nfs'), { container: getField(wrapper, t('type')) })
  await chooseSelectOption(wrapper, t('vhd-file'), { container: getField(wrapper, t('backup-format')), detailed: true })
  await submitDrawer(wrapper)

  return wrapper
}

async function mountDrawerAtReviewStep() {
  const wrapper = await mountDrawerAtDetailsStep()
  await fill(wrapper, t('host-or-ip-address'), '192.168.1.10')
  await fill(wrapper, t('path-on-share'), '/exports/backups')
  await submitDrawer(wrapper)

  return wrapper
}

it.each([
  ['general', mountDrawer],
  ['details', mountDrawerAtDetailsStep],
] as const)('stays on the %s step when it is submitted while invalid', async (step, mountDrawerAtStep) => {
  const wrapper = await mountDrawerAtStep()

  await submitDrawer(wrapper)

  expect(findRenderedSteps(wrapper)).toEqual([step])
})

describe('general step', () => {
  it('is the first step, offering to cancel or to continue', async () => {
    const wrapper = await mountDrawer()

    expect(findRenderedSteps(wrapper)).toEqual(['general'])
    expect(findDrawerButtonLabels(wrapper)).toEqual([t('cancel'), t('action:continue')])
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
    expect(findDrawerButtonLabels(wrapper)).toEqual([t('action:back'), t('action:continue')])
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
    expect(findDrawerButtonLabels(wrapper)).toEqual([t('action:back'), t('action:create')])
  })

  it('does not confirm before it is submitted', async () => {
    const wrapper = await mountDrawerAtReviewStep()

    expect(wrapper.emitted('confirm')).toBeUndefined()
  })

  it('confirms with the repository to create when it is submitted', async () => {
    const wrapper = await mountDrawerAtReviewStep()

    await submitDrawer(wrapper)

    expect(wrapper.emitted('confirm')).toEqual([[{ name: 'My repository', url: expect.any(String) }]])
  })

  it('goes back to the step a section asks to edit', async () => {
    const wrapper = await mountDrawerAtReviewStep()

    await getButton(wrapper, t('action:edit')).trigger('click')

    expect(findRenderedSteps(wrapper)).toEqual(['general'])
  })
})
