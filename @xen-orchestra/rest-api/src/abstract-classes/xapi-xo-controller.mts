import type { XapiXoRecord, XoMessage } from '@vates/types/xo'

import { RestApi } from '../rest-api/rest-api.mjs'
import { BaseController, type BaseControllerType } from './base-controller.mjs'
import { escapeUnsafeComplexMatcher } from '../helpers/utils.helper.mjs'
import { RAW_ALARM_FILTER } from '../alarms/alarm.service.mjs'

export abstract class XapiXoController<T extends XapiXoRecord> extends BaseController<T, true> {
  constructor(type: BaseControllerType<T>, restApi: RestApi) {
    super(type, restApi)
  }

  getObjects(opts?: { filter?: string | ((obj: T) => boolean); limit?: number }): Record<T['id'], T> {
    return this.restApi.getObjectsByType<T>(this.type, opts)
  }

  getObject(id: T['id']): T {
    return this.restApi.getObject<T>(id, this.type)
  }

  getXapiObject(maybeId: T['id'] | T) {
    return this.restApi.getXapiObject<T>(maybeId, this.type)
  }

  getMessagesForObject(
    id: T['id'],
    { filter, limit }: { filter?: string; limit?: number } = {}
  ): Record<XoMessage['id'], XoMessage> {
    const object = this.getObject(id)
    const messages = this.restApi.getObjectsByType<XoMessage>('message', {
      filter: `${escapeUnsafeComplexMatcher(filter) ?? ''} $object:${object.uuid} !${RAW_ALARM_FILTER}`,
      limit,
    })

    return messages
  }
}
