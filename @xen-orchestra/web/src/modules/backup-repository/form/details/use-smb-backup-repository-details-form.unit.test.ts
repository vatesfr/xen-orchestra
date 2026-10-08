import {
  SMB_DEFAULT_DOMAIN,
  useSmbBackupRepositoryDetailsForm,
} from '@/modules/backup-repository/form/details/use-smb-backup-repository-details-form.ts'
import { mountComposable } from '@/test/mount-composable.ts'
import { nextTick } from 'vue'

type SmbFormData = ReturnType<typeof useSmbBackupRepositoryDetailsForm>['formData']

const VALID_FORM_DATA = {
  pathOnShare: 'nas\\backups',
  username: 'admin',
  password: 'secret',
} satisfies Partial<SmbFormData>

function mountSmbForm(formData: Partial<SmbFormData> = {}) {
  const result = mountComposable(() => useSmbBackupRepositoryDetailsForm()).wrapper.vm

  Object.assign(result.formData, formData)

  return result
}

describe('validate', () => {
  it('rejects an empty share, username and password, and reports them on their fields', async () => {
    const result = mountSmbForm()

    expect(await result.validate()).toBe(false)
    expect(result.bindings.pathOnShare.error).toBeDefined()
    expect(result.bindings.username.error).toBeDefined()
    expect(result.bindings.password.error).toBeDefined()
  })

  it('accepts a share with credentials, without subfolder, domain or custom options', async () => {
    const result = mountSmbForm(VALID_FORM_DATA)

    expect(await result.validate()).toBe(true)
  })
})

describe('buildPayload', () => {
  it('describes an SMB repository with its domain and custom options', () => {
    const result = mountSmbForm({
      ...VALID_FORM_DATA,
      subfolder: 'xo\\vms',
      domain: 'CORP',
      customOptions: 'vers=3.0',
    })

    expect(result.buildPayload()).toEqual({
      urlInfo: {
        type: 'smb',
        host: 'nas\\backups',
        path: 'xo\\vms',
        domain: 'CORP',
        username: 'admin',
        password: 'secret',
      },
      options: 'vers=3.0',
    })
  })

  it('falls back to the default SMB domain when none is given', () => {
    const result = mountSmbForm(VALID_FORM_DATA)

    expect(result.buildPayload().urlInfo.domain).toBe(SMB_DEFAULT_DOMAIN)
  })

  it('leaves the options out when no custom option is given', () => {
    const result = mountSmbForm(VALID_FORM_DATA)

    expect(result.buildPayload()).not.toHaveProperty('options')
  })
})

describe('reset', () => {
  it('empties every field and clears the errors', async () => {
    const result = mountSmbForm({ subfolder: 'xo', domain: 'CORP', customOptions: 'vers=3.0' })
    await result.validate()

    result.reset()
    await nextTick()

    expect(result.formData).toEqual({
      pathOnShare: '',
      subfolder: '',
      username: '',
      password: '',
      domain: '',
      customOptions: '',
    })
    expect([result.bindings.pathOnShare.error, result.bindings.username.error, result.bindings.password.error]).toEqual(
      [undefined, undefined, undefined]
    )
  })
})
