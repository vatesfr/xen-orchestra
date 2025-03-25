import { Example, Get, Security, Query, Request, Response, Route, Tags, Path } from 'tsoa'
import { Request as ExRequest } from 'express'
import { inject } from 'inversify'
import { provide } from 'inversify-binding-decorators'
import type { XoVmTemplate } from '@vates/types'

import { notFoundResp, unauthorizedResp, type Unbrand } from '../open-api/common/response.common.mjs'
import { RestApi } from '../rest-api/rest-api.mjs'
import type { WithHref } from '../helpers/helper.type.mjs'

import { XapiXoController } from '../abstract-classes/xapi-xo-controller.mjs'
import { partialVmTemplates, vmTemplateId, vmTemplateIds } from '../open-api/oa-examples/vm-template.oa-example.mjs'

@Route('vm-templates')
@Security('*')
@Response(unauthorizedResp.status, unauthorizedResp.description)
@Tags('vms')
@provide(VmTemplateController)
export class VmTemplateController extends XapiXoController<XoVmTemplate> {
  constructor(@inject(RestApi) restApi: RestApi) {
    super('VM-template', restApi)
  }

  /**
   * @example fields "id,isDefaultTemplate,name_label"
   * @example filter "isDefaultTemplate?"
   * @example limit 42
   * */
  @Example(vmTemplateIds)
  @Example(partialVmTemplates)
  @Get('')
  getVmTemplates(
    @Request() req: ExRequest,
    @Query() fields?: string,
    @Query() filter?: string,
    @Query() limit?: number
  ): string[] | WithHref<Partial<Unbrand<XoVmTemplate>>>[] {
    return this.sendObjects(Object.values(this.getObjects({ filter, limit })), req)
  }

  /**
   * @example id "f07ab729-c0e8-721c-45ec-f11276377030"
   * */
  @Example(vmTemplateId)
  @Get('{id}')
  @Response(notFoundResp.status, notFoundResp.description)
  getVmTemplate(@Path() id: string): Unbrand<XoVmTemplate> {
    return this.getObject(id as XoVmTemplate['id'])
  }
}
