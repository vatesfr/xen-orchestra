import { useLocalBackupRepositoryDetailsForm } from '@/modules/backup-repository/form/details/use-local-backup-repository-details-form.ts'
import type { FrontXoProxy } from '@/modules/proxy/remote-resources/use-xo-proxy-collection.ts'
import { mountComposable } from '@/test/mount-composable.ts'
import { type MaybeRefOrGetter, nextTick, ref } from 'vue'
import { useI18n } from 'vue-i18n'

const PROXY_ID = 'proxy-1' as FrontXoProxy['id']

function mountLocalForm(proxy?: MaybeRefOrGetter<FrontXoProxy['id'] | undefined>) {
  return mountComposable(() => {
    const { t } = useI18n()

    return { ...useLocalBackupRepositoryDetailsForm(proxy), t }
  }).wrapper.vm
}

describe('bindings', () => {
  it('gives no hint on the path when no proxy is selected', () => {
    expect(mountLocalForm().bindings.path.info).toBeUndefined()
  })

  it('hints that the path is absolute on the proxy host when a proxy is selected', () => {
    const result = mountLocalForm(PROXY_ID)

    expect(result.bindings.path.info).toBe(result.t('path-must-be-absolute-on-proxy-host'))
  })

  it('follows the selected proxy', async () => {
    const proxy = ref<FrontXoProxy['id']>()
    const result = mountLocalForm(proxy)

    proxy.value = PROXY_ID
    await nextTick()

    expect(result.bindings.path.info).toBe(result.t('path-must-be-absolute-on-proxy-host'))
  })
})

describe('validate', () => {
  it('rejects an empty path and reports it on the field', async () => {
    const result = mountLocalForm()

    expect(await result.validate()).toBe(false)
    expect(result.bindings.path.error).toBeDefined()
  })

  it('accepts a filled path', async () => {
    const result = mountLocalForm()
    result.formData.path = '/var/lib/xoa/backups'

    expect(await result.validate()).toBe(true)
    expect(result.bindings.path.error).toBeUndefined()
  })
})

describe('buildPayload', () => {
  it('describes a local repository at the given path', () => {
    const result = mountLocalForm()
    result.formData.path = '/var/lib/xoa/backups'

    expect(result.buildPayload()).toEqual({ urlInfo: { type: 'file', path: '/var/lib/xoa/backups' } })
  })
})

describe('reset', () => {
  it('empties the path and clears its error', async () => {
    const result = mountLocalForm()
    await result.validate()
    result.formData.path = '/var/lib/xoa/backups'

    result.reset()
    await nextTick()

    expect(result.formData).toEqual({ path: '' })
    expect(result.bindings.path.error).toBeUndefined()
  })
})
