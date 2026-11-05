import { useAzureBackupRepositoryDetailsForm } from '@/modules/backup-repository/form/details/use-azure-backup-repository-details-form.ts'
import { mountComposable } from '@/test/mount-composable.ts'
import { nextTick, ref } from 'vue'
import type { BackupRepositoryType } from 'xo-remote-parser'

type AzureFormData = ReturnType<typeof useAzureBackupRepositoryDetailsForm>['formData']

const VALID_FORM_DATA = {
  hostName: 'account.blob.core.windows.net',
  accountName: 'account',
  key: 'account-key',
  containerName: 'backups',
} satisfies Partial<AzureFormData>

function mountAzureForm(formData: Partial<AzureFormData> = {}, type: BackupRepositoryType = 'azure') {
  const result = mountComposable(() => useAzureBackupRepositoryDetailsForm(type)).wrapper.vm

  Object.assign(result.formData, formData)

  return result
}

describe('validate', () => {
  it('rejects empty required fields and reports them on their fields', async () => {
    const result = mountAzureForm()

    expect(await result.validate()).toBe(false)
    expect(result.bindings.hostName.error).toBeDefined()
    expect(result.bindings.accountName.error).toBeDefined()
    expect(result.bindings.key.error).toBeDefined()
    expect(result.bindings.containerName.error).toBeDefined()
  })

  it('accepts the required fields without a path in the container', async () => {
    const result = mountAzureForm(VALID_FORM_DATA)

    expect(await result.validate()).toBe(true)
  })
})

describe('buildPayload', () => {
  it('describes an Azure repository over HTTPS by default', () => {
    const result = mountAzureForm({ ...VALID_FORM_DATA, pathInContainer: 'xo/vms' })

    expect(result.buildPayload()).toEqual({
      urlInfo: {
        type: 'azure',
        protocol: 'https',
        host: 'account.blob.core.windows.net',
        path: 'backups/xo/vms',
        username: 'account',
        password: 'account-key',
      },
    })
  })

  it('describes an Azurite repository when the type is azurite', () => {
    const result = mountAzureForm(VALID_FORM_DATA, 'azurite')

    expect(result.buildPayload().urlInfo.type).toBe('azurite')
  })

  it('uses HTTP when HTTPS is turned off', () => {
    const result = mountAzureForm({ ...VALID_FORM_DATA, useHttps: false }, 'azurite')

    expect(result.buildPayload().urlInfo.protocol).toBe('http')
  })

  it('follows the selected type', () => {
    const type = ref<BackupRepositoryType>('azure')
    const { wrapper } = mountComposable(() => useAzureBackupRepositoryDetailsForm(type))

    type.value = 'azurite'

    expect(wrapper.vm.buildPayload().urlInfo.type).toBe('azurite')
  })
})

describe('reset', () => {
  it('restores the initial values and clears the errors', async () => {
    const result = mountAzureForm({ useHttps: false, pathInContainer: 'xo' })
    await result.validate()

    result.reset()
    await nextTick()

    expect(result.formData).toEqual({
      hostName: '',
      useHttps: true,
      accountName: '',
      key: '',
      containerName: '',
      pathInContainer: '',
    })
    expect(result.bindings.hostName.error).toBeUndefined()
  })
})
