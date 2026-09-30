import { useS3BackupRepositoryDetailsForm } from '@/modules/backup-repository/form/details/use-s3-backup-repository-details-form.ts'
import { mountComposable } from '@/test/mount-composable.ts'
import { nextTick } from 'vue'

type S3FormData = ReturnType<typeof useS3BackupRepositoryDetailsForm>['formData']

const VALID_FORM_DATA = {
  endpoint: 's3.us-east-2.amazonaws.com',
  region: 'us-east-2',
  accessKeyId: 'access-key',
  secret: 'secret-key',
  bucket: 'backups',
} satisfies Partial<S3FormData>

function mountS3Form(formData: Partial<S3FormData> = {}) {
  const result = mountComposable(() => useS3BackupRepositoryDetailsForm()).wrapper.vm

  Object.assign(result.formData, formData)

  return result
}

describe('formData', () => {
  it('stops allowing unauthorized certificates when HTTPS is turned off', async () => {
    const result = mountS3Form({ useHttps: true, allowUnauthorized: true })
    await nextTick()

    result.formData.useHttps = false
    await nextTick()

    expect(result.formData.allowUnauthorized).toBe(false)
  })
})

describe('validate', () => {
  it('rejects empty required fields and reports them on their fields', async () => {
    const result = mountS3Form()

    expect(await result.validate()).toBe(false)
    expect(result.bindings.endpoint.error).toBeDefined()
    expect(result.bindings.region.error).toBeDefined()
    expect(result.bindings.accessKeyId.error).toBeDefined()
    expect(result.bindings.secret.error).toBeDefined()
    expect(result.bindings.bucket.error).toBeDefined()
  })

  it('accepts the required fields without a path in the bucket', async () => {
    const result = mountS3Form(VALID_FORM_DATA)

    expect(await result.validate()).toBe(true)
  })
})

describe('buildPayload', () => {
  it('describes an S3 repository over HTTP by default', () => {
    const result = mountS3Form({ ...VALID_FORM_DATA, pathInBucket: 'xo/vms' })

    expect(result.buildPayload()).toEqual({
      urlInfo: {
        type: 's3',
        protocol: 'http',
        host: 's3.us-east-2.amazonaws.com',
        path: 'backups/xo/vms',
        region: 'us-east-2',
        username: 'access-key',
        password: 'secret-key',
      },
    })
  })

  it('uses HTTPS when it is turned on', () => {
    const result = mountS3Form({ ...VALID_FORM_DATA, useHttps: true })

    expect(result.buildPayload().urlInfo.protocol).toBe('https')
  })

  it('leaves allowUnauthorized out unless it is turned on', () => {
    const result = mountS3Form({ ...VALID_FORM_DATA, useHttps: true })

    expect(result.buildPayload().urlInfo).not.toHaveProperty('allowUnauthorized')
  })

  it('allows unauthorized certificates when it is turned on', () => {
    const result = mountS3Form({ ...VALID_FORM_DATA, useHttps: true, allowUnauthorized: true })

    expect(result.buildPayload().urlInfo.allowUnauthorized).toBe(true)
  })
})

describe('reset', () => {
  it('restores the initial values and clears the errors', async () => {
    const result = mountS3Form({ useHttps: true, allowUnauthorized: true, pathInBucket: 'xo' })
    await result.validate()

    result.reset()
    await nextTick()

    expect(result.formData).toEqual({
      endpoint: '',
      useHttps: false,
      allowUnauthorized: false,
      region: '',
      accessKeyId: '',
      secret: '',
      bucket: '',
      pathInBucket: '',
    })
    expect(result.bindings.endpoint.error).toBeUndefined()
  })
})
