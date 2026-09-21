import HostSystemHardwareSpecifications from '@/modules/host/components/system/HostSystemHardwareSpecifications.vue'
import type { FrontXoHost } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import type { FrontXoPci, useXoPciCollection } from '@/modules/pci/remote-resources/use-xo-pci-collection.ts'
import type { FrontXoPgpu, useXoPgpuCollection } from '@/modules/pgpu/remote-resources/use-xo-pgpu-collection.ts'
import { createHost } from '@/test/create-host.ts'
import { createPci } from '@/test/create-pci.ts'
import { createPgpu } from '@/test/create-pgpu.ts'
import { findTitleText } from '@/test/find-card-heading.ts'
import { findLabelledValues } from '@/test/find-labelled-values.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import { mount } from '@vue/test-utils'
import { ref } from 'vue'

const { useXoPciCollectionMock, useXoPgpuCollectionMock } = vi.hoisted(() => ({
  useXoPciCollectionMock: vi.fn(),
  useXoPgpuCollectionMock: vi.fn(),
}))

vi.mock(import('@/modules/pci/remote-resources/use-xo-pci-collection.ts'), () => ({
  useXoPciCollection: useXoPciCollectionMock as unknown as typeof useXoPciCollection,
}))

vi.mock(import('@/modules/pgpu/remote-resources/use-xo-pgpu-collection.ts'), () => ({
  useXoPgpuCollection: useXoPgpuCollectionMock as unknown as typeof useXoPgpuCollection,
}))

beforeEach(() => {
  useXoPciCollectionMock.mockReset()
  useXoPgpuCollectionMock.mockReset()

  givenDevices()
})

function givenDevices({
  pgpus = [],
  pcis = [],
  arePgpusReady = true,
  arePcisReady = true,
}: { pgpus?: FrontXoPgpu[]; pcis?: FrontXoPci[]; arePgpusReady?: boolean; arePcisReady?: boolean } = {}) {
  const pgpusById = new Map(pgpus.map(pgpu => [pgpu.id, pgpu]))
  const pcisById = new Map(pcis.map(pci => [pci.id, pci]))

  useXoPgpuCollectionMock.mockReturnValue({
    getPgpuById: (id: FrontXoPgpu['id']) => pgpusById.get(id),
    arePgpusReady: ref(arePgpusReady),
  })

  useXoPciCollectionMock.mockReturnValue({
    getPciById: (id: FrontXoPci['id']) => pcisById.get(id),
    arePcisReady: ref(arePcisReady),
  })
}

function mountHardwareSpecifications(host: FrontXoHost = createHost()) {
  return mount(HostSystemHardwareSpecifications, {
    props: { host },
    global: createGlobalTestConfig(),
  })
}

it('renders the card title', () => {
  const wrapper = mountHardwareSpecifications()

  expect(findTitleText(wrapper)).toBe(t('hardware-specifications'))
})

it('shows the manufacturer, the BIOS, the CPU model and the core layout of the host', () => {
  const wrapper = mountHardwareSpecifications(
    createHost({
      bios_strings: {
        'system-manufacturer': 'Dell',
        'system-product-name': 'PowerEdge R640',
        'bios-vendor': 'Dell Inc.',
        'bios-version': '2.15.0',
      },
      CPUs: { modelname: 'Intel(R) Xeon(R) Gold 6230' },
      cpus: { cores: 16, sockets: 2 },
    })
  )

  expect(findLabelledValues(wrapper)).toMatchObject({
    [t('manufacturer-info')]: 'Dell (PowerEdge R640)',
    [t('bios-info')]: 'Dell Inc. (2.15.0)',
    [t('cpu-model')]: 'Intel(R) Xeon(R) Gold 6230',
    [t('core-socket')]: '16 (2)',
  })
})

it('leaves out the product name and the BIOS version the host does not report', () => {
  const wrapper = mountHardwareSpecifications(
    createHost({ bios_strings: { 'system-manufacturer': 'Dell', 'bios-vendor': 'Dell Inc.' } })
  )

  expect(findLabelledValues(wrapper)).toMatchObject({
    [t('manufacturer-info')]: 'Dell',
    [t('bios-info')]: 'Dell Inc.',
  })
})

it('falls back to empty specifications when the host reports no BIOS strings, CPU model nor core count', () => {
  const wrapper = mountHardwareSpecifications(createHost({ bios_strings: {}, CPUs: {}, cpus: {} }))

  expect(findLabelledValues(wrapper)).toMatchObject({
    [t('manufacturer-info')]: '',
    [t('bios-info')]: '',
    [t('cpu-model')]: '',
    [t('core-socket')]: '0 (0)',
  })
})

describe('GPUs', () => {
  function mountGpus(host: FrontXoHost) {
    return findLabelledValues(mountHardwareSpecifications(host))[t('gpus')]
  }

  it('lists the name of every PCI device backing a GPU of the host, in order', () => {
    givenDevices({
      pgpus: [
        createPgpu({ id: 'pgpu-1' as FrontXoPgpu['id'], pci: 'pci-1' as FrontXoPgpu['pci'] }),
        createPgpu({ id: 'pgpu-2' as FrontXoPgpu['id'], pci: 'pci-2' as FrontXoPgpu['pci'] }),
      ],
      pcis: [
        createPci({ id: 'pci-1' as FrontXoPci['id'], device_name: 'GA102GL [A40]' }),
        createPci({ id: 'pci-2' as FrontXoPci['id'], device_name: 'TU104GL [Tesla T4]' }),
      ],
    })

    expect(mountGpus(createHost({ PGPUs: ['pgpu-1', 'pgpu-2'] as FrontXoHost['PGPUs'] }))).toBe(
      'GA102GL [A40], TU104GL [Tesla T4]'
    )
  })

  it('reports no GPU when the host has none', () => {
    expect(mountGpus(createHost({ PGPUs: [] }))).toBe(t('none'))
  })

  it('skips a GPU that is still unknown', () => {
    givenDevices({
      pgpus: [createPgpu({ id: 'pgpu-1' as FrontXoPgpu['id'], pci: 'pci-1' as FrontXoPgpu['pci'] })],
      pcis: [createPci({ id: 'pci-1' as FrontXoPci['id'], device_name: 'GA102GL [A40]' })],
    })

    expect(mountGpus(createHost({ PGPUs: ['pgpu-1', 'pgpu-missing'] as FrontXoHost['PGPUs'] }))).toBe('GA102GL [A40]')
  })

  it('skips a GPU attached to no PCI device', () => {
    givenDevices({ pgpus: [createPgpu({ id: 'pgpu-1' as FrontXoPgpu['id'], pci: undefined })] })

    expect(mountGpus(createHost({ PGPUs: ['pgpu-1'] as FrontXoHost['PGPUs'] }))).toBe(t('none'))
  })

  it('skips a GPU whose PCI device is still unknown', () => {
    givenDevices({
      pgpus: [createPgpu({ id: 'pgpu-1' as FrontXoPgpu['id'], pci: 'pci-missing' as FrontXoPgpu['pci'] })],
    })

    expect(mountGpus(createHost({ PGPUs: ['pgpu-1'] as FrontXoHost['PGPUs'] }))).toBe(t('none'))
  })

  it('skips a PCI device reporting no name', () => {
    givenDevices({
      pgpus: [createPgpu({ id: 'pgpu-1' as FrontXoPgpu['id'], pci: 'pci-1' as FrontXoPgpu['pci'] })],
      pcis: [createPci({ id: 'pci-1' as FrontXoPci['id'], device_name: '' })],
    })

    expect(mountGpus(createHost({ PGPUs: ['pgpu-1'] as FrontXoHost['PGPUs'] }))).toBe(t('none'))
  })

  it('stays empty while the GPUs of the host are still loading', () => {
    givenDevices({ arePgpusReady: false })

    expect(mountGpus(createHost({ PGPUs: [] }))).toBe('')
  })

  it('stays empty while the PCI devices are still loading', () => {
    givenDevices({ arePcisReady: false })

    expect(mountGpus(createHost({ PGPUs: [] }))).toBe('')
  })
})
