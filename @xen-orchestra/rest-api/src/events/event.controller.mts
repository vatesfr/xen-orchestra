import {
  Body,
  Controller,
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

import { badRequestResp, createdResp, unauthorizedResp, Unbrand } from '../open-api/common/response.common.mjs'
import { provide } from 'inversify-binding-decorators'
import { inject } from 'inversify'
import { EventService, SseConnectionId, SseSubscriptionId } from './event.service.mjs'
import { AuthenticatedRequest } from '../helpers/helper.type.mjs'
import { XapiXoRecord } from '@vates/types'
import { json } from 'express'

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
  openSseConnection(@Request() req: AuthenticatedRequest): void {
    const evService = this.#eventService
    const clientId = evService.createSseClient(req.res)
    evService.sendData(clientId, { event: 'init', data: { id: clientId } })
  }

  /**
   * Add a subscription in the SSE connection
   */
  @Post('{id}/subscription')
  @Middlewares(json())
  @SuccessResponse(createdResp.status, createdResp.description)
  subscribeCollection(
    @Path() id: string,
    @Body() body: { collection: XapiXoRecord['type'] | 'alarm' }
  ): { id: Unbrand<SseSubscriptionId> } {
    const subscribtionId = this.#eventService.subscribeXapiCollection(id as SseConnectionId, body.collection)
    return {
      id: subscribtionId,
    }
  }
}
