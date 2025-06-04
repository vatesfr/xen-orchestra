import type { XoSchedule } from '@vates/types'
import { Example, Get, Path, Post, Query, Request, Response, Route, Security, SuccessResponse, Tags } from 'tsoa'
import { provide } from 'inversify-binding-decorators'
import type { Request as ExRequest } from 'express'

import {
  asynchronousAction,
  featureUnauthorized,
  internalServerErrorResp,
  noContentResp,
  notFoundResp,
  unauthorizedResp,
  type Unbrand,
} from '../open-api/common/response.common.mjs'
import { partialSchedules, schedule, scheduleIds } from '../open-api/oa-examples/schedule.oa-example.mjs'
import { taskLocation } from '../open-api/oa-examples/task.oa-example.mjs'
import type { WithHref } from '../helpers/helper.type.mjs'
import { XoController } from '../abstract-classes/xo-controller.mjs'

@Route('schedules')
@Security('*')
@Response(unauthorizedResp.status, unauthorizedResp.description)
@Tags('schedules')
@provide(ScheduleController)
export class ScheduleController extends XoController<XoSchedule> {
  // --- abstract methods
  getAllCollectionObjects(): Promise<XoSchedule[]> {
    return this.restApi.xoApp.getAllSchedules()
  }
  getCollectionObject(id: XoSchedule['id']): Promise<XoSchedule> {
    return this.restApi.xoApp.getSchedule(id)
  }

  /**
   * @example fields "enabled,jobId,cron,id"
   * @example filter "enabled?"
   * @example limit 42
   */
  @Example(scheduleIds)
  @Example(partialSchedules)
  @Get('')
  async getSchedules(
    @Request() req: ExRequest,
    @Query() fields?: string,
    @Query() filter?: string,
    @Query() limit?: number
  ): Promise<string[] | WithHref<Partial<Unbrand<XoSchedule>>>[]> {
    return this.sendObjects(Object.values(await this.getObjects({ filter, limit })), req)
  }

  /**
   * @example id "cf7249f8-d20b-494f-97f4-b1f32f94e780"
   */
  @Example(schedule)
  @Get('{id}')
  @Response(notFoundResp.status, notFoundResp.description)
  async getSchedule(@Path() id: string): Promise<Unbrand<XoSchedule>> {
    return this.getObject(id as XoSchedule['id'])
  }

  /**
   * @example id "cf7249f8-d20b-494f-97f4-b1f32f94e780"
   */
  @Example(taskLocation)
  @Post('{id}/actions/run')
  @SuccessResponse(asynchronousAction.status, asynchronousAction.description, asynchronousAction.produce)
  @Response(noContentResp.status, noContentResp.description)
  @Response(featureUnauthorized.status, featureUnauthorized.description)
  @Response(notFoundResp.status, notFoundResp.description)
  @Response(internalServerErrorResp.status, internalServerErrorResp.description)
  async runSchedule(@Path() id: string, @Query() sync?: boolean) {
    const scheduleId = id as XoSchedule['id']
    const action = async () => {
      const xoApp = this.restApi.xoApp
      const schedule = await this.getObject(scheduleId)
      const job = await xoApp.getJob(schedule.jobId)
      await xoApp.runJob(job, schedule)
    }

    return this.createAction(action, {
      sync,
      statusCode: noContentResp.status,
      taskProperties: { name: 'run schedule', objectId: scheduleId },
    })
  }
}
