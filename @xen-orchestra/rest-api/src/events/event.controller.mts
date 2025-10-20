import {
  Body,
  Controller,
  Example,
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

import {
  badRequestResp,
  createdResp,
  noContentResp,
  notFoundResp,
  unauthorizedResp,
} from '../open-api/common/response.common.mjs'
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
   * Opens an SSE (Server-Sent Events) connection.
   *
   * By default, there are no active subscriptions in the stream.
   * To add subscriptions, use the following endpoint:
   *
   *    POST /rest/v0/events/:id/subscription
   *
   *
   * Events you will receive:
   * - **init**: The first event you will receive.
   *   Data: the connection ID.
   *
   * - **ping**: A simple event used to keep the connection alive between the server and the client.
   *   Data: the event timestamp.
   *
   * - **add**: Triggered when an object has been added.
   *   Data: the added object.
   *
   * - **update**: Triggered when an object has been updated.
   *   Data: the updated object.
   *
   * - **remove**: Triggered when an object has been removed.
   *   Data: the removed object.
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
   * @example body {"collection": "VM", "fields": ["id", "name_label"]}
   */
  @Example(addSubscription)
  @Post('{id}/subscription')
  @Middlewares(json())
  @SuccessResponse(createdResp.status, createdResp.description)
  @Response(notFoundResp.status, notFoundResp.description)
  addSubscription(
    @Path() id: string,
    @Body() body: { collection: XapiXoListenerType; fields?: '*' | string[] }
  ): { id: string } {
    this.#eventService.addListenerFor(id as SubscriberId, { ...body, type: body.collection })
    return { id: body.collection }
  }

  /**
   * Remove a subscription
   *
   * @example id "0d8b28c6-e9bf-4c9d-a382-3c9e0d7cfbff"
   * @example subscriptionId: "VM"
   */
  @Delete('{id}/subscription/{subscriptionId}')
  @SuccessResponse(noContentResp.status, noContentResp.description)
  @Response(notFoundResp.status, notFoundResp.description)
  removeSubscription(@Path() id: string, @Path() subscriptionId: XapiXoListenerType): void {
    this.#eventService.removeListenerFor(id as SubscriberId, subscriptionId)
  }
}
