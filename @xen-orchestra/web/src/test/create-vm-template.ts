import type { FrontXoVmTemplate } from '@/modules/vm/remote-resources/use-xo-vm-template-collection.ts'

export function createVmTemplate(overrides: Partial<FrontXoVmTemplate> = {}): FrontXoVmTemplate {
  return {
    id: 'template-123' as FrontXoVmTemplate['id'],
    uuid: 'template-123',
    name_label: 'Other install media',
    name_description: '',
    $pool: 'pool-789' as FrontXoVmTemplate['$pool'],
    template_info: { disks: [], install_methods: [] },
    VIFs: [],
    $VBDs: [],
    boot: {},
    CPUs: { max: 1, number: 1 },
    memory: { dynamic: [], size: 1073741824, static: [] },
    tags: [],
    isDefaultTemplate: true,
    type: 'VM-template',
    bios_strings: {},
    secureBoot: false,
    high_availability: '',
    ...overrides,
  }
}
