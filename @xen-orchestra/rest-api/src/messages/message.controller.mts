import * as CM from 'complex-matcher'
import { Example, Get, Path, Query, Request, Response, Route, Security, Tags } from 'tsoa'
import type { Request as ExRequest } from 'express'
import { inject } from 'inversify'
import { noSuchObject } from 'xo-common/api-errors.js'
import { provide } from 'inversify-binding-decorators'
import type { XoMessage } from '@vates/types'

import { alarmPredicate } from '../alarms/alarm.controller.mjs'
import { message, messageIds, partialMessages } from '../open-api/oa-examples/message.oa-example.mjs'
import { RestApi } from '../rest-api/rest-api.mjs'
import { notFoundResp, unauthorizedResp, type Unbrand } from '../open-api/common/response.common.mjs'
import type { SendObjects } from '../helpers/helper.type.mjs'
import { XapiXoController } from '../abstract-classes/xapi-xo-controller.mjs'

type UnbrandedXoMessage = Unbrand<XoMessage>

@Route('messages')
@Security('*')
@Response(unauthorizedResp.status, unauthorizedResp.description)
@Tags('message')
@provide(MessageController)
export class MessageController extends XapiXoController<XoMessage> {
  constructor(@inject(RestApi) restapi: RestApi) {
    super('message', restapi)
  }

  /**
   * Override parent getObjects in order to exclude `ALARM` messages
   */
  getObjects({ filter, limit = Infinity }: { filter?: string; limit?: number } = {}): Record<
    XoMessage['id'],
    XoMessage
  > {
    let userfilter: (obj: XoMessage) => boolean = () => true
    if (filter !== undefined) {
      userfilter = CM.parse(filter).createPredicate()
    }
    const messagePredicate = (obj: XoMessage) => !alarmPredicate(obj) && userfilter(obj)

    return super.getObjects({ filter: messagePredicate, limit })
  }

  /**
   * Override parent getObject in order to exclude`ALARM` message
   */
  getObject(id: XoMessage['id']): XoMessage {
    const message = super.getObject(id)

    if (alarmPredicate(message)) {
      /* throw */ noSuchObject(id, 'message')
    }

    return message
  }

  /**
   * @example fields "name,body,id,$object"
   * @example filter "name:VM_STARTED"
   * @example limit 42
   */
  @Example(messageIds)
  @Example(partialMessages)
  @Get('')
  getMessages(
    @Request() req: ExRequest,
    @Query() fields?: string,
    @Query() ndjson?: boolean,
    @Query() filter?: string,
    @Query() limit?: number
  ): SendObjects<Partial<UnbrandedXoMessage>> {
    return this.sendObjects(Object.values(this.getObjects({ filter, limit })), req)
  }

  /**
   * @example id "f775eaeb-abe5-94e0-9682-14c37c3a1dfe"
   */
  @Example(message)
  @Get('{id}')
  @Response(notFoundResp.status, notFoundResp.description)
  getMessage(@Path() id: string): UnbrandedXoMessage {
    return this.getObject(id as XoMessage['id'])
  }
}
