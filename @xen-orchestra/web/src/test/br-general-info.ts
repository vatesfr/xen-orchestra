import type { FrontXoBackupRepository } from '@/modules/backup-repository/remote-resources/use-xo-backup-repository-collection.ts'
import { createBr } from '@/test/create-br.ts'
import { createProxy } from '@/test/create-proxy.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import { proxyCollectionMock } from '@/test/mock-xo-proxy-collection.ts'
import { mount, type VueWrapper } from '@vue/test-utils'
import type { Component } from 'vue'
import { parse as parseBackupRepositoryUrl } from 'xo-remote-parser'

// More assertions on the same case, and the end of its test name they add
type ExtraCase = { name: string; expect: (wrapper: VueWrapper) => void }

type BrGeneralInfoCase = {
  // Reads the rendered values by their label
  findValues: (wrapper: VueWrapper) => Record<string, string>
  // The test of a plain NFS repository: its name, the fields of the repository and the other values the card shows
  plain: { name: string; br?: Partial<FrontXoBackupRepository>; values?: Record<string, string> }
  unknownUrl?: ExtraCase
  proxy?: ExtraCase
}

/**
 * Registers the tests every card of the general information of a backup repository shares (the component taking
 * the repository and its parsed url): the values of a plain repository, its status, the storage mode and encryption of an encrypted repository, an
 * unrecognized url and its proxy, read from the mocked proxy collection (`mock-xo-proxy-collection.ts`, which it
 * resets before each test). Returns the mount of the card, on a new repository by default.
 */
export function itShowsBrGeneralInfo(
  component: Component,
  { findValues, plain, unknownUrl, proxy }: BrGeneralInfoCase
) {
  beforeEach(() => {
    proxyCollectionMock.reset()
  })

  function mountCard(br: FrontXoBackupRepository = createBr()) {
    return mount(component, {
      props: { br, parsedBrUrl: parseBackupRepositoryUrl(br.url) },
      global: createGlobalTestConfig(),
    })
  }

  it(plain.name, () => {
    const wrapper = mountCard(createBr({ url: 'nfs://192.168.100.225:/media/nfs', ...plain.br }))

    expect(findValues(wrapper)).toEqual({
      ...plain.values,
      [t('status')]: t('enabled'),
      [t('type')]: t('nfs'),
      [t('storage-mode')]: t('file-based'),
      [t('proxy')]: '',
      [t('encryption')]: t('disabled'),
    })
  })

  it('shows a disabled repository as disabled', () => {
    const wrapper = mountCard(createBr({ enabled: false }))

    expect(findValues(wrapper)).toMatchObject({ [t('status')]: t('disabled') })
  })

  it('shows an enabled repository with an error as unable to connect', () => {
    const wrapper = mountCard(createBr({ error: { code: 'ENOENT' } }))

    expect(findValues(wrapper)).toMatchObject({ [t('status')]: t('unable-to-connect') })
  })

  it('shows the block based storage mode and the encryption of an encrypted repository', () => {
    const wrapper = mountCard(
      createBr({ url: 'nfs://192.168.100.225:/media/nfs?useVhdDirectory=true&encryptionKey=%22secret%22' })
    )

    expect(findValues(wrapper)).toMatchObject({
      [t('storage-mode')]: t('block-based'),
      [t('encryption')]: t('enabled'),
    })
  })

  it(`shows an unrecognized url as unknown type and storage mode${unknownUrl?.name ?? ''}`, () => {
    const wrapper = mountCard(createBr({ url: 'ftp://192.168.100.225/backup' }))

    expect(findValues(wrapper)).toMatchObject({
      [t('type')]: t('unknown'),
      [t('storage-mode')]: t('unknown'),
    })
    unknownUrl?.expect(wrapper)
  })

  it(`shows the proxy the repository goes through${proxy?.name ?? ''}`, () => {
    const proxyRecord = createProxy({ name: 'Remote site proxy' })
    proxyCollectionMock.proxies.value = [proxyRecord]

    const wrapper = mountCard(createBr({ proxy: proxyRecord.id }))

    expect(findValues(wrapper)).toMatchObject({ [t('proxy')]: 'Remote site proxy' })
    proxy?.expect(wrapper)
  })

  return mountCard
}
