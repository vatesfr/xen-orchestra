import { Example, Get, Security, Query, Request, Response, Route, Tags, Path } from 'tsoa'
import { Request as ExRequest } from 'express'
import { inject } from 'inversify'
import { provide } from 'inversify-binding-decorators'
import type { XoAlarm, XoVmTemplate } from '@vates/types'

import { AlarmService } from '../alarms/alarm.service.mjs'
import { genericAlarmsExample } from '../open-api/oa-examples/alarm.oa-example.mjs'
import { notFoundResp, unauthorizedResp, type Unbrand } from '../open-api/common/response.common.mjs'
import { RestApi } from '../rest-api/rest-api.mjs'
import type { SendObjects } from '../helpers/helper.type.mjs'

import { XapiXoController } from '../abstract-classes/xapi-xo-controller.mjs'
import { partialVmTemplates, vmTemplate, vmTemplateIds } from '../open-api/oa-examples/vm-template.oa-example.mjs'

@Route('vm-templates')
@Security('*')
@Response(unauthorizedResp.status, unauthorizedResp.description)
@Tags('vms')
@provide(VmTemplateController)
export class VmTemplateController extends XapiXoController<XoVmTemplate> {
  #alarmService: AlarmService
  constructor(@inject(RestApi) restApi: RestApi, @inject(AlarmService) alarmService: AlarmService) {
    super('VM-template', restApi)
    this.#alarmService = alarmService
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
    @Query() ndjson?: boolean,
    @Query() filter?: string,
    @Query() limit?: number
  ): SendObjects<Partial<Unbrand<XoVmTemplate>>> {
    return this.sendObjects(Object.values(this.getObjects({ filter, limit })), req)
  }

  /**
   * @example id "b7569d99-30f8-178a-7d94-801de3e29b5b-f873abe0-b138-4995-8f6f-498b423d234d"
   * */
  @Example(vmTemplate)
  @Get('{id}')
  @Response(notFoundResp.status, notFoundResp.description)
  getVmTemplate(@Path() id: string): Unbrand<XoVmTemplate> {
    return this.getObject(id as XoVmTemplate['id'])
  }

  /**
   * @example id "b7569d99-30f8-178a-7d94-801de3e29b5b-f873abe0-b138-4995-8f6f-498b423d234d"
   * @example fields "id,time"
   * @example filter "time:>1747053793"
   * @example limit 42
   */
  @Example(genericAlarmsExample)
  @Get('{id}/alarms')
  @Tags('alarms')
  @Response(notFoundResp.status, notFoundResp.description)
  getVmTemplateAlarms(
    @Request() req: ExRequest,
    @Path() id: string,
    @Query() fields?: string,
    @Query() ndjson?: boolean,
    @Query() filter?: string,
    @Query() limit?: number
  ): SendObjects<Partial<Unbrand<XoAlarm>>> {
    const vmTemplate = this.getObject(id as XoVmTemplate['id'])
    const alarms = this.#alarmService.getAlarms({
      filter: `${filter ?? ''} object:uuid:${vmTemplate.uuid}`,
      limit,
    })

    return this.sendObjects(Object.values(alarms), req, 'alarms')
  }
}
