import BackupRepositoryFormRow from '@/modules/backup-repository/components/form/BackupRepositoryFormRow.vue'
import BackupRepositoryFormCheckbox from '@/modules/backup-repository/components/form/inputs/BackupRepositoryFormCheckbox.vue'
import BackupRepositoryFormSelect from '@/modules/backup-repository/components/form/inputs/BackupRepositoryFormSelect.vue'
import BackupRepositoryFormTextInput from '@/modules/backup-repository/components/form/inputs/BackupRepositoryFormTextInput.vue'
import BackupRepositoryGeneralStep from '@/modules/backup-repository/components/form/steps/BackupRepositoryGeneralStep.vue'
import {
  type BackupRepositoryGeneralFormData,
  useBackupRepositoryGeneralForm,
} from '@/modules/backup-repository/form/use-backup-repository-general-form.ts'
import type { useXoProxyCollection } from '@/modules/proxy/remote-resources/use-xo-proxy-collection.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { defineComponent, h, reactive, ref } from 'vue'

vi.mock(import('@/modules/proxy/remote-resources/use-xo-proxy-collection.ts'), () => ({
  useXoProxyCollection: (() => ({ proxies: ref([]) })) as unknown as typeof useXoProxyCollection,
}))

function mountGeneralStep(formData: Partial<BackupRepositoryGeneralFormData> = {}, { hideEncryption = false } = {}) {
  const data = reactive<BackupRepositoryGeneralFormData>({
    name: '',
    type: undefined,
    backupFormat: undefined,
    proxy: undefined,
    encrypted: false,
    encryptionKey: '',
    ...formData,
  })

  const wrapper = mount(
    defineComponent(() => {
      const { bindings } = useBackupRepositoryGeneralForm(data)

      return () => h(BackupRepositoryGeneralStep, { bindings, hideEncryption })
    }),
    { global: createGlobalTestConfig(), attachTo: document.body }
  )

  return { wrapper, data }
}

function findLabels(
  wrapper: VueWrapper,
  component: typeof BackupRepositoryFormSelect | typeof BackupRepositoryFormTextInput
) {
  return wrapper.findAllComponents(component).map(input => input.props('label'))
}

function findSectionTitles(wrapper: VueWrapper) {
  return wrapper.findAll('.section > .ui-title').map(title => title.text())
}

it('splits the fields into a general information section and an options section', () => {
  const { wrapper } = mountGeneralStep()

  expect(findSectionTitles(wrapper)).toEqual([t('general-information'), t('options')])
})

it('hides the options section, and its encryption, when asked to', () => {
  const { wrapper } = mountGeneralStep({}, { hideEncryption: true })

  expect(findSectionTitles(wrapper)).toEqual([t('general-information')])
  expect(wrapper.findComponent(BackupRepositoryFormCheckbox).exists()).toBe(false)
})

it('offers the name, type, backup format and proxy fields', () => {
  const { wrapper } = mountGeneralStep()

  expect(findLabels(wrapper, BackupRepositoryFormTextInput)).toEqual([t('name')])
  expect(findLabels(wrapper, BackupRepositoryFormSelect)).toEqual([t('type'), t('backup-format'), t('proxy')])
})

it('warns that the encryption is available for the block based format only', () => {
  const { wrapper } = mountGeneralStep()

  expect(wrapper.get('.ui-alert').text()).toContain(t('encryption-available-for-block-modes-only'))
})

it('hides the encryption key until the encryption is enabled', () => {
  const { wrapper } = mountGeneralStep({ type: 's3', backupFormat: 'block' })

  expect(wrapper.findComponent(BackupRepositoryFormCheckbox).exists()).toBe(true)
  expect(findLabels(wrapper, BackupRepositoryFormTextInput)).not.toContain(t('key'))
})

it('shows the encryption key on the same row as the encryption, once enabled', async () => {
  const { wrapper, data } = mountGeneralStep({ type: 's3', backupFormat: 'block' })

  data.encrypted = true
  await flushPromises()

  const encryptionRow = wrapper
    .findAllComponents(BackupRepositoryFormRow)
    .find(row => row.findComponent(BackupRepositoryFormCheckbox).exists())

  expect(findLabels(encryptionRow!, BackupRepositoryFormTextInput)).toEqual([t('key')])
})

it('describes each backup format with its hint', async () => {
  const { wrapper } = mountGeneralStep({ type: 'nfs' })
  await flushPromises()

  const backupFormatSelect = wrapper
    .findAllComponents(BackupRepositoryFormSelect)
    .find(select => select.props('label') === t('backup-format'))

  await backupFormatSelect!.get('.ui-input').trigger('click')
  await flushPromises()

  expect(wrapper.findAll('.option-content').map(option => option.text())).toEqual([
    expect.stringMatching(new RegExp(`${t('block-based')}.*${t('block-based-hint')}`, 's')),
    expect.stringMatching(new RegExp(`${t('vhd-file')}.*${t('vhd-file-hint')}`, 's')),
  ])
})
