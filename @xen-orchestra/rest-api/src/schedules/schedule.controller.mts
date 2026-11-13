import type { AnyXoJob, XoSchedule } from '@vates/types'
import {
  Body,
  Delete,
  Example,
  Extension,
  Get,
  Middlewares,
  Patch,
  Path,
  Post,
  Query,
  Request,
  Response,
  Route,
  Security,
  SuccessResponse,
  Tags,
} from 'tsoa'
import { inject } from 'inversify'
import { provide } from 'inversify-binding-decorators'
import { json, type Request as ExRequest } from 'express'
import { noSuchObject } from 'xo-common/api-errors.js'

import { acl } from '../middlewares/acl.middleware.mjs'
import {
  asynchronousActionResp,
  badRequestResp,
  createdResp,
  featureUnauthorized,
  forbiddenOperationResp,
  internalServerErrorResp,
  invalidParameters,
  noContentResp,
  notFoundResp,
  unauthorizedResp,
  type Unbrand,
} from '../open-api/common/response.common.mjs'
import { partialSchedules, schedule, scheduleId, scheduleIds } from '../open-api/oa-examples/schedule.oa-example.mjs'
import { taskLocation } from '../open-api/oa-examples/task.oa-example.mjs'
import type { SendObjects } from '../helpers/helper.type.mjs'
import { XoController } from '../abstract-classes/xo-controller.mjs'
import { assertValidCron } from '../helpers/utils.helper.mjs'
import type { CreateActionReturnType } from '../abstract-classes/base-controller.mjs'
import { RestApi } from '../rest-api/rest-api.mjs'
import type { CreateScheduleBody, UpdateScheduleBody } from './schedule.type.mjs'

@Route('schedules')
@Security('*')
@Response(badRequestResp.status, badRequestResp.description)
@Response(unauthorizedResp.status, unauthorizedResp.description)
@Tags('schedules')
@provide(ScheduleController)
export class ScheduleController extends XoController<XoSchedule> {
  constructor(@inject(RestApi) restApi: RestApi) {
    super('schedule', restApi)
  }

  // --- abstract methods
  getAllCollectionObjects(): Promise<XoSchedule[]> {
    return this.restApi.xoApp.getAllSchedules()
  }
  getCollectionObject(id: XoSchedule['id']): Promise<XoSchedule> {
    return this.restApi.xoApp.getSchedule(id)
  }

  /**
   * Returns all schedules that match the following privilege:
   * - resource: schedule, action: read
   *
   * @example fields "enabled,jobId,cron,id"
   * @example filter "enabled?"
   * @example limit 42
   */
  @Example(scheduleIds)
  @Example(partialSchedules)
  @Extension('x-mcp-exposure', 'allow')
  @Get('')
  @Security('*', ['acl'])
  async getSchedules(
    @Request() req: ExRequest,
    @Query() fields?: string,
    @Query() ndjson?: boolean,
    @Query() markdown?: boolean,
    @Query() filter?: string,
    @Query() limit?: number
  ): SendObjects<Partial<Unbrand<XoSchedule>>> {
    return this.sendObjects(Object.values(await this.getObjects({ filter })), req, {
      limit,
      privilege: { action: 'read', resource: 'schedule' },
    })
  }

  /**
   *
   * Required privilege:
   * - resource: schedule, action: read
   *
   * @example id "cf7249f8-d20b-494f-97f4-b1f32f94e780"
   */
  @Example(schedule)
  @Extension('x-mcp-exposure', 'allow')
  @Get('{id}')
  @Middlewares(
    acl({
      resource: 'schedule',
      action: 'read',
      objectId: 'params.id',
      getObject:
        ({ restApi }) =>
        id =>
          restApi.xoApp.getSchedule(id),
    })
  )
  @Response(forbiddenOperationResp.status, forbiddenOperationResp.description)
  @Response(notFoundResp.status, notFoundResp.description)
  async getSchedule(@Path() id: string): Promise<Unbrand<XoSchedule>> {
    return this.getObject(id as XoSchedule['id'])
  }

  /**
   *
   * Required privilege:
   * - resource: schedule, action: run
   *
   * @example id "cf7249f8-d20b-494f-97f4-b1f32f94e780"
   */
  @Example(taskLocation)
  @Extension('x-mcp-exposure', 'confirm')
  @Post('{id}/actions/run')
  @Middlewares(
    acl({
      resource: 'schedule',
      action: 'run',
      objectId: 'params.id',
      getObject:
        ({ restApi }) =>
        id =>
          restApi.xoApp.getSchedule(id),
    })
  )
  @SuccessResponse(asynchronousActionResp.status, asynchronousActionResp.description)
  @Response(noContentResp.status, noContentResp.description)
  @Response(featureUnauthorized.status, featureUnauthorized.description)
  @Response(forbiddenOperationResp.status, forbiddenOperationResp.description)
  @Response(notFoundResp.status, notFoundResp.description)
  @Response(internalServerErrorResp.status, internalServerErrorResp.description)
  async runSchedule(@Path() id: string, @Query() sync?: boolean): CreateActionReturnType<void> {
    const scheduleId = id as XoSchedule['id']
    const action = async () => {
      const xoApp = this.restApi.xoApp
      const schedule = await this.getObject(scheduleId)
      const job = await xoApp.getJob(schedule.jobId)
      await xoApp.runJob(job, schedule)
    }

    return this.createAction<void>(action, {
      sync,
      statusCode: noContentResp.status,
      taskProperties: { name: 'run schedule', objectId: scheduleId },
    })
  }

  /**
   * Create a schedule for an existing job.
   *
   * Only usable by administrators.
   *
   * @example body {
   *   "cron": "0 0 * * *",
   *   "enabled": true,
   *   "jobId": "a87827cf-57fc-48a6-aa77-a0a14771f8f3",
   *   "name": "daily",
   *   "timezone": "Europe/Paris"
   * }
   */
  @Example(scheduleId)
  @Extension('x-mcp-exposure', 'confirm')
  @Post('')
  @Middlewares(json())
  @SuccessResponse(createdResp.status, createdResp.description)
  @Response(invalidParameters.status, invalidParameters.description)
  @Response(notFoundResp.status, notFoundResp.description)
  async createSchedule(@Body() body: CreateScheduleBody): Promise<{ id: Unbrand<XoSchedule>['id'] }> {
    const xoApp = this.restApi.xoApp
    const { enabled = false, jobId, ...props } = body

    assertValidCron(props.cron, props.timezone)

    // throws if the job does not exist
    const job = await xoApp.getJob(jobId as AnyXoJob['id'])

    const schedule = await xoApp.createSchedule({
      ...props,
      enabled,
      jobId: job.id,
      userId: this.restApi.getCurrentUser().id,
    })

    // backup executors expect an entry per schedule in the job settings
    if ('settings' in job) {
      await xoApp.updateJob({ id: job.id, settings: { ...job.settings, [schedule.id]: {} } })
    }

    return { id: schedule.id }
  }

  /**
   * Only usable by administrators.
   *
   * @example id "cf7249f8-d20b-494f-97f4-b1f32f94e780"
   * @example body { "enabled": false }
   */
  @Extension('x-mcp-exposure', 'confirm')
  @Patch('{id}')
  @Middlewares(json())
  @SuccessResponse(noContentResp.status, noContentResp.description)
  @Response(invalidParameters.status, invalidParameters.description)
  @Response(notFoundResp.status, notFoundResp.description)
  async updateSchedule(@Path() id: string, @Body() body: UpdateScheduleBody): Promise<void> {
    const schedule = await this.getObject(id as XoSchedule['id'])

    // xo-server stops the schedule before parsing the new cron
    if (body.cron !== undefined || body.timezone !== undefined) {
      assertValidCron(body.cron ?? schedule.cron, body.timezone ?? schedule.timezone)
    }

    await this.restApi.xoApp.updateSchedule({ ...body, id: schedule.id })
  }

  /**
   * Delete a schedule, and its settings from the related job.
   *
   * The job settings are read then rewritten: concurrent changes to the settings of the same job may be lost.
   *
   * Only usable by administrators.
   *
   * @example id "cf7249f8-d20b-494f-97f4-b1f32f94e780"
   */
  @Extension('x-mcp-exposure', 'confirm')
  @Delete('{id}')
  @SuccessResponse(noContentResp.status, noContentResp.description)
  @Response(notFoundResp.status, notFoundResp.description)
  async deleteSchedule(@Path() id: string): Promise<void> {
    const xoApp = this.restApi.xoApp
    const schedule = await this.getObject(id as XoSchedule['id'])

    await xoApp.deleteSchedule(schedule.id)

    let job: AnyXoJob
    try {
      job = await xoApp.getJob(schedule.jobId)
    } catch (error) {
      if (noSuchObject.is(error)) {
        return
      }
      throw error
    }

    if ('settings' in job && job.settings[schedule.id] !== undefined) {
      const { [schedule.id]: _, ...settings } = job.settings
      await xoApp.updateJob({ id: job.id, settings })
    }
  }
}
