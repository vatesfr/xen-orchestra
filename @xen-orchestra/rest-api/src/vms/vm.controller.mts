import { Example, Get, Path, Query, Request, Response, Route, Security } from 'tsoa'
import { Request as ExRequest } from 'express'
import { inject } from 'inversify'
import { provide } from 'inversify-binding-decorators'
import type { XoVm } from '@vates/types'

import { RestApi } from '../rest-api/rest-api.mjs'
import type { Unbrand, WithHref } from '../helpers/helper.type.mjs'
import { XapiXoController } from '../abstract-classes/xapi-xo-controller.mjs'

@Route('vms')
@Security('*')
@Response(401)
// the `provide` decorator is mandatory on class that injects/receives dependencies.
// It automatically bind the class to the IOC container that handles dependency injection
@provide(VmController)
export class VmController extends XapiXoController<'VM'> {
  constructor(@inject(RestApi) restApi: RestApi) {
    super('VM', restApi)
  }

  /**
   *
   * @example fields "name_label,power_state"
   * @example filter "name_label:foo"
   * @example limit 42
   */
  @Example(['/rest/v0/vms/f07ab729-c0e8-721c-45ec-f11276377030', '/rest/v0/vms/d5d1c4a3-4c5e-ca7b-6be8-33c824f87571'])
  @Example([
    {
      name_label: 'foo',
      power_state: 'Running',
      href: '/rest/v0/vms/f07ab729-c0e8-721c-45ec-f11276377030',
    },
    {
      name_label: 'foo_bar',
      power_state: 'Halted',
      href: '/rest/v0/vms/d5d1c4a3-4c5e-ca7b-6be8-33c824f87571',
    },
  ])
  @Get('')
  getVms(
    @Request() req: ExRequest,
    @Query() fields?: string,
    @Query() filter?: string,
    @Query() limit?: number
  ): string[] | WithHref<Partial<Unbrand<XoVm>>>[] {
    return this.sendObjects(Object.values(this.getObjects({ filter, limit })), req)
  }

  /**
   *
   * @example id "f07ab729-c0e8-721c-45ec-f11276377030"
   */
  @Example({
    type: 'VM',
    addresses: {},
    auto_poweron: false,
    bios_strings: {
      'bios-vendor': 'Xen',
      'bios-version': '',
      'system-manufacturer': 'Xen',
      'system-product-name': 'HVM domU',
      'system-version': '',
      'system-serial-number': '',
      'hp-rombios': '',
      'oem-1': 'Xen',
      'oem-2': 'MS_VM_CERT/SHA1/bdbeb6e0a816d43fa6d3fe8aaef04c2bad9d3e3d',
    },
    blockedOperations: {},
    boot: {
      firmware: 'bios',
      order: 'cd',
    },
    CPUs: {
      max: 2,
      number: 2,
    },
    creation: {
      date: '2024-12-18T15:08:43.142Z',
      template: 'bfa83003-ac1a-dde9-6a44-6cca5fd3e735',
      user: 'd558dd75-c928-45f6-b8e3-4375bdda59f8',
    },
    current_operations: {},
    expNestedHvm: false,
    viridian: false,
    high_availability: '',
    isFirmwareSupported: true,
    memory: {
      dynamic: [4294967296, 4294967296],
      static: [2147483648, 4294967296],
      size: 4294967296,
    },
    installTime: 1734534522,
    name_description: 'Debian 12 Cloud-Init Ready Hub Template',
    name_label: 'MRA XOA',
    needsVtpm: false,
    other: {
      'xo:f07ab729':
        '{"creation":{"date":"2024-12-18T15:08:43.142Z","template":"bfa83003-ac1a-dde9-6a44-6cca5fd3e735","user":"d558dd75-c928-45f6-b8e3-4375bdda59f8"}}',
      'xo:resource:namespace': 'Debian12',
      'xo:resource:xva:version': '1.0.0',
      'xo:resource:xva:id': 'e2fb63ba-1a5d-7527-bfca-14fef610bf6f',
      'xo:resource:installedTemplate:uuid': 'bfa83003-ac1a-dde9-6a44-6cca5fd3e735',
      import_task: 'OpaqueRef:7c274dba-70ef-1f28-ab31-9c7ef5b26c51',
      mac_seed: 'ebcb83b9-b96d-6341-931c-9d5105656bf2',
      vgpu_pci: '',
      base_template_name: 'Debian Jessie 8.0',
      'install-methods': 'cdrom,nfs,http,ftp',
      linux_template: 'true',
    },
    os_version: null,
    power_state: 'Halted',
    hasVendorDevice: false,
    snapshots: [],
    startDelay: 0,
    startTime: null,
    secureBoot: false,
    tags: [],
    VIFs: ['803382fb-9d69-fbf7-8fef-2b3a8adfce5a'],
    VTPMs: [],
    virtualizationMode: 'hvm',
    $container: 'b7569d99-30f8-178a-7d94-801de3e29b5b',
    $VBDs: ['43ecda28-e716-a60e-5322-ee6597d07aec', 'a30d24aa-188c-dc6d-6ee3-5bf1e504a3e9'],
    VGPUs: [],
    $VGPUs: [],
    xenStoreData: {
      'vm-data/mmio-hole-size': '268435456',
      'vm-data': '',
    },
    vga: 'cirrus',
    videoram: 4,
    id: 'f07ab729-c0e8-721c-45ec-f11276377030',
    uuid: 'f07ab729-c0e8-721c-45ec-f11276377030',
    $pool: 'b7569d99-30f8-178a-7d94-801de3e29b5b',
    $poolId: 'b7569d99-30f8-178a-7d94-801de3e29b5b',
    _xapiRef: 'OpaqueRef:ffdf8863-5331-9394-5c1b-d1db7de20a76',
  })
  @Get('{id}')
  @Response(404)
  getVm(@Path() id: string): Unbrand<XoVm> {
    return this.getObject(id as XoVm['id'])
  }
}
