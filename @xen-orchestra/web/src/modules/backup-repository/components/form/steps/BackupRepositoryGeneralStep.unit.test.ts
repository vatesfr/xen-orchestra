import BackupRepositoryFormRow from '@/modules/backup-repository/components/form/BackupRepositoryFormRow.vue'
import BackupRepositoryFormSelect from '@/modules/backup-repository/components/form/inputs/BackupRepositoryFormSelect.vue'
import FormCheckbox from '@/shared/components/form/FormCheckbox.vue'
import FormTextInput from '@/shared/components/form/FormTextInput.vue'
import { findTitles } from '@/test/find-titles.ts'
import { t } from '@/test/i18n.ts'
import { proxyCollectionMock, mockXoProxyCollection } from '@/test/mock-xo-proxy-collection.ts'
import { mountBrGeneralStep } from '@/test/mount-br-general-step.ts'
import { openSelect } from '@core-test/select.ts'
import { flushPromises, type VueWrapper } from '@vue/test-utils'

mockXoProxyCollection()

beforeEach(() => {
  proxyCollectionMock.reset()
})

function findLabels(wrapper: VueWrapper, component: typeof BackupRepositoryFormSelect | typeof FormTextInput) {
  return wrapper.findAllComponents(component).map(input => input.props('label'))
}

it('splits the fields into a general information section and an options section', () => {
  const { wrapper } = mountBrGeneralStep()

  expect(findTitles(wrapper)).toEqual([t('general-information'), t('options')])
})

it('hides the options section, and its encryption, when asked to', () => {
  const { wrapper } = mountBrGeneralStep({}, { hideEncryption: true })

  expect(findTitles(wrapper)).toEqual([t('general-information')])
  expect(wrapper.findComponent(FormCheckbox).exists()).toBe(false)
})

it('offers the name, type, backup format and proxy fields', () => {
  const { wrapper } = mountBrGeneralStep()

  expect(findLabels(wrapper, FormTextInput)).toEqual([t('name')])
  expect(findLabels(wrapper, BackupRepositoryFormSelect)).toEqual([t('type'), t('backup-format'), t('proxy')])
})

it('warns that the encryption is available for the block based format only', () => {
  const { wrapper } = mountBrGeneralStep()

  expect(wrapper.get('.ui-alert').text()).toContain(t('encryption-available-for-block-modes-only'))
})

it('hides the encryption key until the encryption is enabled', () => {
  const { wrapper } = mountBrGeneralStep({ type: 's3', backupFormat: 'block' })

  expect(wrapper.findComponent(FormCheckbox).exists()).toBe(true)
  expect(findLabels(wrapper, FormTextInput)).not.toContain(t('key'))
})

it('shows the encryption key on the same row as the encryption, once enabled', async () => {
  const { wrapper, data } = mountBrGeneralStep({ type: 's3', backupFormat: 'block' })

  data.encrypted = true
  await flushPromises()

  const encryptionRow = wrapper
    .findAllComponents(BackupRepositoryFormRow)
    .find(row => row.findComponent(FormCheckbox).exists())

  expect(findLabels(encryptionRow!, FormTextInput)).toEqual([t('key')])
})

it('describes each backup format with its hint', async () => {
  const { wrapper } = mountBrGeneralStep({ type: 'nfs' })
  await flushPromises()

  const backupFormatSelect = wrapper
    .findAllComponents(BackupRepositoryFormSelect)
    .find(select => select.props('label') === t('backup-format'))

  await openSelect(backupFormatSelect!)

  expect(wrapper.findAll('.option-content').map(option => option.text())).toEqual([
    expect.stringMatching(new RegExp(`${t('block-based')}.*${t('block-based-hint')}`, 's')),
    expect.stringMatching(new RegExp(`${t('vhd-file')}.*${t('vhd-file-hint')}`, 's')),
  ])
})
