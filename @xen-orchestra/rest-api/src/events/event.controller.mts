import { Controller, Get, Request, Response, Route, Security, Tags } from 'tsoa'

import { badRequestResp, unauthorizedResp } from '../open-api/common/response.common.mjs'
import { provide } from 'inversify-binding-decorators'
import { inject } from 'inversify'
import { EventService } from './event.service.mjs'
import { AuthenticatedRequest } from '../helpers/helper.type.mjs'

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
}
