import {
  type BackupRepositoryGeneralFormData,
  useBackupRepositoryGeneralForm,
} from '@/modules/backup-repository/form/use-backup-repository-general-form.ts'
import type { useXoProxyCollection } from '@/modules/proxy/remote-resources/use-xo-proxy-collection.ts'
import { mountComposable } from '@/test/mount-composable.ts'
import { flushPromises } from '@vue/test-utils'
import { reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import type { BackupRepositoryType } from 'xo-remote-parser'

vi.mock(import('@/modules/proxy/remote-resources/use-xo-proxy-collection.ts'), () => ({
  useXoProxyCollection: (() => ({ proxies: ref([]) })) as unknown as typeof useXoProxyCollection,
}))

const ENCRYPTION_KEY = '0123456789abcdef0123456789ABCDEF'

function createGeneralFormData(): BackupRepositoryGeneralFormData {
  return { name: '', type: undefined, backupFormat: undefined, proxy: undefined, encrypted: false, encryptionKey: '' }
}

async function mountGeneralForm(formData: Partial<BackupRepositoryGeneralFormData> = {}) {
  const result = mountComposable(() => {
    const { t } = useI18n()

    return { ...useBackupRepositoryGeneralForm(reactive(createGeneralFormData())), t }
  }).wrapper.vm

  const { type, ...otherFormData } = formData

  result.formData.type = type
  await flushPromises()

  Object.assign(result.formData, otherFormData)
  await flushPromises()

  return result
}

describe('formData', () => {
  it.each<BackupRepositoryType>(['s3', 'azure', 'azurite'])(
    'forces the block based format for the %s type',
    async type => {
      const result = await mountGeneralForm({ type })

      expect(result.formData.backupFormat).toBe('block')
    }
  )

  it.each<BackupRepositoryType>(['file', 'nfs', 'smb'])('leaves the format to choose for the %s type', async type => {
    const result = await mountGeneralForm({ type })

    expect(result.formData.backupFormat).toBeUndefined()
  })

  it('asks for the format again when leaving a block-only type', async () => {
    const result = await mountGeneralForm({ type: 's3' })

    result.formData.type = 'nfs'
    await flushPromises()

    expect(result.formData.backupFormat).toBeUndefined()
  })

  it('turns the encryption off, and drops its key, when the format is no longer block based', async () => {
    const result = await mountGeneralForm({
      type: 'nfs',
      backupFormat: 'block',
      encrypted: true,
      encryptionKey: ENCRYPTION_KEY,
    })

    result.formData.backupFormat = 'vhd'
    await flushPromises()

    expect(result.formData).toMatchObject({ encrypted: false, encryptionKey: '' })
  })

  it('drops the encryption key when the encryption is turned off', async () => {
    const result = await mountGeneralForm({
      type: 'nfs',
      backupFormat: 'block',
      encrypted: true,
      encryptionKey: ENCRYPTION_KEY,
    })

    result.formData.encrypted = false
    await flushPromises()

    expect(result.formData.encryptionKey).toBe('')
  })
})

describe('bindings', () => {
  it('disables the encryption unless the format is block based', async () => {
    const result = await mountGeneralForm({ type: 'nfs', backupFormat: 'vhd' })

    expect(result.bindings.encrypted.disabled).toBe(true)
  })

  it('enables the encryption for the block based format', async () => {
    const result = await mountGeneralForm({ type: 'nfs', backupFormat: 'block' })

    expect(result.bindings.encrypted.disabled).toBe(false)
  })
})

describe('validate', () => {
  it('rejects an empty name, type and format, and reports them on their fields', async () => {
    const result = await mountGeneralForm()

    expect(await result.validate()).toBe(false)
    expect(result.bindings.name.error).toBeDefined()
    expect(result.bindings.type.error).toBeDefined()
    expect(result.bindings.backupFormat.error).toBeDefined()
  })

  it('accepts a name, a type and a format, without proxy nor encryption', async () => {
    const result = await mountGeneralForm({ name: 'My repository', type: 'nfs', backupFormat: 'vhd' })

    expect(await result.validate()).toBe(true)
  })

  it('rejects an encrypted repository without a key', async () => {
    const result = await mountGeneralForm({ name: 'My repository', type: 's3', encrypted: true })

    expect(await result.validate()).toBe(false)
    expect(result.bindings.encryptionKey.error).toBeDefined()
  })

  it.each(['0123456789abcdef', `${ENCRYPTION_KEY}0`, 'g123456789abcdef0123456789abcdef'])(
    'rejects the malformed encryption key %s',
    async encryptionKey => {
      const result = await mountGeneralForm({ name: 'My repository', type: 's3', encrypted: true, encryptionKey })

      expect(await result.validate()).toBe(false)
      expect(result.bindings.encryptionKey.error).toMatchObject({
        content: result.t('encryption-key-invalid', { n: 32 }),
      })
    }
  )

  it('accepts a 32 hexadecimal characters encryption key, whatever its case', async () => {
    const result = await mountGeneralForm({
      name: 'My repository',
      type: 's3',
      encrypted: true,
      encryptionKey: ENCRYPTION_KEY,
    })

    expect(await result.validate()).toBe(true)
  })
})

describe('buildUrlOptions', () => {
  it('is empty for an unencrypted VHD repository', async () => {
    const result = await mountGeneralForm({ type: 'nfs', backupFormat: 'vhd' })

    expect(result.buildUrlOptions()).toEqual({})
  })

  it('stores the backups in VHD directories for the block based format', async () => {
    const result = await mountGeneralForm({ type: 'nfs', backupFormat: 'block' })

    expect(result.buildUrlOptions()).toEqual({ useVhdDirectory: true })
  })

  it('carries the encryption key of an encrypted repository', async () => {
    const result = await mountGeneralForm({ type: 's3', encrypted: true, encryptionKey: ENCRYPTION_KEY })

    expect(result.buildUrlOptions()).toEqual({ useVhdDirectory: true, encryptionKey: ENCRYPTION_KEY })
  })
})
