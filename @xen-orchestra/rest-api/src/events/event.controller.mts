import {
  Body,
  Controller,
  Delete,
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

import { badRequestResp, createdResp, unauthorizedResp } from '../open-api/common/response.common.mjs'
import { provide } from 'inversify-binding-decorators'
import { inject } from 'inversify'
import { EventService } from './event.service.mjs'
import { AuthenticatedRequest } from '../helpers/helper.type.mjs'
import { json } from 'express'
import type { SubscriberId, XapiXoListenerType } from './event.type.mjs'

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
  openSseConnection(@Request() req: AuthenticatedRequest) {
    this.#eventService.createSseSubscriber(req.res)
  }

  /**
   * Add a subscription in the SSE connection
   */
  @Post('{id}/subscription')
  @Middlewares(json())
  @SuccessResponse(createdResp.status, createdResp.description)
  subscribeCollection(
    @Path() id: string,
    @Body() body: { collection: XapiXoListenerType; fields?: string }
  ): { id: string } {
    this.#eventService.addXapiXoListenerFor(id as SubscriberId, body)
    return { id: body.collection }
  }

  /**
   * Remove a subscription in the SSE connection
   */
  @Delete('{id}/subscription/{subscriptionId}')
  removeSubscription(@Path() id: string, @Path() subscriptionId: XapiXoListenerType): void {
    this.#eventService.removeListenerFor(id as SubscriberId, subscriptionId)
  }
}
