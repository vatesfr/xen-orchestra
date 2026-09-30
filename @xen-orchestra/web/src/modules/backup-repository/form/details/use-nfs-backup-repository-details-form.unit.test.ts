import {
  NFS_DEFAULT_PORT,
  useNfsBackupRepositoryDetailsForm,
} from '@/modules/backup-repository/form/details/use-nfs-backup-repository-details-form.ts'
import { mountComposable } from '@/test/mount-composable.ts'
import { nextTick } from 'vue'
import { useI18n } from 'vue-i18n'

type NfsFormData = ReturnType<typeof useNfsBackupRepositoryDetailsForm>['formData']

const VALID_FORM_DATA = {
  host: '192.168.1.10',
  path: '/exports/backups',
} satisfies Partial<NfsFormData>

function mountNfsForm(formData: Partial<NfsFormData> = {}) {
  const result = mountComposable(() => {
    const { t } = useI18n()

    return { ...useNfsBackupRepositoryDetailsForm(), t }
  }).wrapper.vm

  Object.assign(result.formData, formData)

  return result
}

describe('validate', () => {
  it('rejects an empty host and an empty path, and reports them on their fields', async () => {
    const result = mountNfsForm()

    expect(await result.validate()).toBe(false)
    expect(result.bindings.host.error).toBeDefined()
    expect(result.bindings.path.error).toBeDefined()
  })

  it('accepts a host and a path without a port', async () => {
    const result = mountNfsForm(VALID_FORM_DATA)

    expect(await result.validate()).toBe(true)
  })

  it.each(['0', '65536', '20a49', '-1'])('rejects the invalid port %s', async port => {
    const result = mountNfsForm({ ...VALID_FORM_DATA, port })

    expect(await result.validate()).toBe(false)
    expect(result.bindings.port.error).toMatchObject({ content: result.t('invalid-port') })
  })

  it.each(['1', '2049', '65535'])('accepts the valid port %s', async port => {
    const result = mountNfsForm({ ...VALID_FORM_DATA, port })

    expect(await result.validate()).toBe(true)
  })
})

describe('buildPayload', () => {
  it('describes an NFS repository with its port and custom options', () => {
    const result = mountNfsForm({ ...VALID_FORM_DATA, port: '2050', customOptions: 'vers=4' })

    expect(result.buildPayload()).toEqual({
      urlInfo: { type: 'nfs', host: '192.168.1.10', port: '2050', path: '/exports/backups' },
      options: 'vers=4',
    })
  })

  it('falls back to the default NFS port when none is given', () => {
    const result = mountNfsForm(VALID_FORM_DATA)

    expect(result.buildPayload().urlInfo.port).toBe(NFS_DEFAULT_PORT)
  })

  it('leaves the options out when no custom option is given', () => {
    const result = mountNfsForm(VALID_FORM_DATA)

    expect(result.buildPayload()).not.toHaveProperty('options')
  })
})

describe('reset', () => {
  it('empties every field and clears the errors', async () => {
    const result = mountNfsForm({ port: '70000', customOptions: 'vers=4' })
    await result.validate()

    result.reset()
    await nextTick()

    expect(result.formData).toEqual({ host: '', port: '', path: '', customOptions: '' })
    expect([result.bindings.host.error, result.bindings.port.error, result.bindings.path.error]).toEqual([
      undefined,
      undefined,
      undefined,
    ])
  })
})
