import { Body, Example, Get, Path, Post, Query, Response, Request, Route, Security, Tags } from 'tsoa'
import { inject } from 'inversify'
import { provide } from 'inversify-binding-decorators'
import type { Request as ExRequest } from 'express'
import { RestApi } from '../rest-api/rest-api.mjs'
import { createdResp, notFoundResp, unauthorizedResp, type Unbrand } from '../open-api/common/response.common.mjs'
import type { WithHref } from '../helpers/helper.type.mjs'
import { XapiXoController } from '../abstract-classes/xapi-xo-controller.mjs'
import type { Xapi, XoPool, XoSr, XoVgpuType, XoVmTemplate } from '@vates/types'
import { partialPools, pool, poolIds } from '../open-api/oa-examples/pool.oa-example.mjs'

@Route('pools')
@Security('*')
@Response(unauthorizedResp.status, unauthorizedResp.description)
@Tags('pools')
@provide(PoolController)
export class PoolController extends XapiXoController<XoPool> {
  constructor(@inject(RestApi) restApi: RestApi) {
    super('pool', restApi)
  }

  /**
   *
   * @example fields "auto_poweron,name_label,id"
   * @example filter "auto_poweron?"
   * @example limit 42
   */
  @Example(poolIds)
  @Example(partialPools)
  @Get('')
  getPools(
    @Request() req: ExRequest,
    @Query() fields?: string,
    @Query() filter?: string,
    @Query() limit?: number
  ): string[] | WithHref<Partial<Unbrand<XoPool>>>[] {
    return this.sendObjects(Object.values(this.getObjects({ filter, limit })), req)
  }

  /**
   * @example id "355ee47d-ff4c-4924-3db2-fd86ae629676"
   */
  @Example(pool)
  @Get('{id}')
  @Response(notFoundResp.status, notFoundResp.description)
  getPool(@Path() id: string): Unbrand<XoPool> {
    return this.getObject(id as XoPool['id'])
  }

  @Post('{id}/actions/create_vm')
  async createVm(
    @Path() id: string,
    @Body() body: Omit<Unbrand<Parameters<Xapi['createVm']>[1]>, 'existingVdis' | 'nameLabel'>,
    @Query() sync?: boolean
  ): Promise<void | string> {
    const poolId = id as XoPool['id']
    const action = async () => {
      // params.affinityHost = affinity;
      // params.installRepository = install === null || install === void 0 ? void 0 : install.repository;
      // Mac expect min length 1
      // params.vifs = params.vifs.map(vif => {
      //  var _vif$mac;
      //   return {
      //    ...vif,
      //    mac: ((_vif$mac = vif.mac) === null || _vif$mac === void 0 ? void 0 : _vif$mac.trim()) ?? ''
      //  };
      // });

      // myFn(@Path() id: string, @Body() body: {templateId: XoVmTeplate['id']})
      // const app = this.restApi.xoApp
      // const xapi = app.getXapi(poolId)
      // const vm = await xapi.createVm(
      //   body.templateUuid,
      //   {
      //     name_label: body.name_label,
      //     clone: body.clone,
      //     installRepository: body.installRepository,
      //     vdis: body.vdis,
      //     vifs: body.vifs,
      //     vgpuType: body.vgpuType,
      //     gpuGroup: body.gpuGroup as XoGpuGroup['_xapiRef'],
      //     copyHostBiosStrings: body.copyHostBiosStrings,
      //   },
      //   undefined,
      //   app.apiContext.user.id,
      // )

      // const vm = await xapi.createVm(template, params, undefined, app.apiContext.user.id);
      // $defer.onFailure.call($xapi, 'VM_destroy', vm.$ref);
      let cloudConfigVdiUuid
      // if (cloud_config !== undefined) {
      //   cloudConfigVdiUuid = await xapi.VM_createCloudInitConfig(vm.$ref, cloud_config, {
      //     networkConfig: network_config
      //   });
      // }
      let timeLimit
      // if (boot) {
      //   timeLimit = Date.now() + 10 * 60 * 1000;
      //   await xapi.callAsync('VM.start', vm.$ref, false, false);
      // }
      // if (destroy_cloud_config_vdi && cloudConfigVdiUuid !== undefined && boot) {
      //   try {
      //     await xapi.VDI_destroyCloudInitConfig(xapi.getObject(cloudConfigVdiUuid).$ref, {
      //       timeLimit
      //     });
      //   } catch (error) {
      //     console.error('destroy cloud init config VDI failed', {
      //       error,
      //       vdi: {
      //         uuid: cloudConfigVdiUuid
      //       },
      //       vm: {
      //         uuid: vm.uuid
      //       }
      //     });
      //   }
      // }
      // return vm.uuid;
    }

    return this.createAction(action, {
      sync,
      statusCode: createdResp.status,
      taskProperties: {
        name: 'create VM',
        objectId: poolId,
      },
    })
  }
}
