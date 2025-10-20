import {
  Body,
  Controller,
  Example,
  Get,
  Middlewares,
  Path,
  Post,
  Request,
  Response,
  Route,
  Security,
  SuccessResponse,
  Tags,
} from 'tsoa'

import { badRequestResp, createdResp, notFoundResp, unauthorizedResp } from '../open-api/common/response.common.mjs'
import { provide } from 'inversify-binding-decorators'
import { inject } from 'inversify'
import { EventService } from './event.service.mjs'
import type { AuthenticatedRequest } from '../helpers/helper.type.mjs'
import { json } from 'express'
import type { SubscriberId, XapiXoListenerType } from './event.type.mjs'
import { addSubscription } from '../open-api/oa-examples/event.oa-example.mjs'

@Route('events')
@Security('*')
@Response(badRequestResp.status, badRequestResp.description)
@Response(unauthorizedResp.status, unauthorizedResp.description)
@Tags('events')
@provide(EventController)
export class EventController extends Controller {
  #eventService: EventService

  constructor(@inject(EventService) eventService: EventService) {
    super()
    this.#eventService = eventService
  }

  /**
   * Open an SSE connection
   */
  @Get('')
  @SuccessResponse(200, 'Ok')
  openSseConnection(@Request() req: AuthenticatedRequest) {
    this.#eventService.createSseSubscriber(req.res)
  }

  /**
   * Add a subscription
   *
   * @example id "0d8b28c6-e9bf-4c9d-a382-3c9e0d7cfbff"
   * @example body {"collection": "VM", "fields": "id,name_label"}
   */
  @Example(addSubscription)
  @Post('{id}/subscription')
  @Middlewares(json())
  @SuccessResponse(createdResp.status, createdResp.description)
  @Response(notFoundResp.status, notFoundResp.description)
  addSubscription(
    @Path() id: string,
    @Body() body: { collection: XapiXoListenerType; fields?: string }
  ): { id: string } {
    this.#eventService.addListenerFor(id as SubscriberId, { ...body, type: body.collection })
    return { id: body.collection }
  }
}
