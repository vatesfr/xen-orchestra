import crypto from 'node:crypto'
import isEqual from 'lodash/isEqual.js'
import pick from 'lodash/pick.js'
import { Branded, XapiXoRecord, XoAlarm } from '@vates/types'
import { createLogger } from '@xen-orchestra/log'
import type { Response } from 'express'

import { ApiError } from '../helpers/error.helper.mjs'
import { RestApi } from '../rest-api/rest-api.mjs'
import { AlarmService } from '../alarms/alarm.service.mjs'

export type SseConnectionId = Branded<'SSE'>

export type SseSubscriptionId = Branded<'SSE-subscription'>

const log = createLogger('xo:rest-api:event-service')

export class EventService {
  #alarmService: AlarmService
  #clients: Map<
    SseConnectionId,
    {
      connection: Response
      intervalByFeatureName: Record<string, NodeJS.Timeout>
      subscriptions: Record<
        SseSubscriptionId,
        {
          collection: XapiXoRecord['type'] | 'alarm'
          unsubscribe(): void
          fields: string
        }
      >
    }
  > = new Map()
  #restApi: RestApi

  constructor(restApi: RestApi) {
    process.on('SIGTERM', () => {
      log.debug(`SIGTERM received, close all SSE clients (nb: ${this.#clients.size})`)
      this.#clients.forEach((_, id) => this.#removeSseClient(id))
    })

    this.#restApi = restApi
    this.#alarmService = restApi.ioc.get(AlarmService)
  }

  createSseClient(res: Response): SseConnectionId {
    const headers = new Headers({
      'Content-Type': 'text/event-stream',
      Connection: 'keep-alive',
      'Cache-Control': 'no-cache, no-transform',
    })
    res.setHeaders(headers)

    const id = crypto.randomUUID() as SseConnectionId

    res.on('close', () => this.#removeSseClient(id))

    // ensure to keep the connection alive
    const pingInterval = setInterval(() => this.sendData(id, { event: 'ping', data: { ping: Date.now() } }), 1000 * 5)
    this.#clients.set(id, {
      connection: res,
      intervalByFeatureName: {
        ping: pingInterval,
      },
      subscriptions: {},
    })
    log.debug(`new SSE client added: ${id}`)
    log.debug(`nb client: ${this.#clients.size}`)
    return id
  }

  subscribeXapiCollection(
    id: SseConnectionId,
    { collection, fields = '*' }: { collection: XapiXoRecord['type'] | 'alarm'; fields?: string }
  ) {
    const xapiType = collection === 'alarm' ? 'message' : collection
    const client = this.#clients.get(id)
    if (client === undefined) {
      throw new ApiError(`no SSE client found for ID: ${id}`, 404)
    }
    const ee = this.#restApi.xoApp.objects.allIndexes.type.getEventEmitterByType(xapiType)
    if (ee === undefined) {
      throw new ApiError(`no Event Emitter found for collection: ${collection}`, 404)
    }

    for (const id in client.subscriptions) {
      if (client.subscriptions[id].collection === collection) {
        throw new ApiError(`${collection} already has a subscription. ID: ${id}`, 409)
      }
    }

    // Exclude XoAlarm as Alarm are parsed XoMessage (XoAlarm doesn't exist at the XAPI level)
    const handleXapiEvent =
      (event: 'add' | 'remove' | 'update') =>
      <T extends Exclude<XapiXoRecord, XoAlarm>>(object: T | undefined, previousObj?: T) => {
        let _object: Partial<XapiXoRecord> | undefined = object
        let _prevObject: Partial<XapiXoRecord> | undefined = previousObj

        if (collection === 'alarm') {
          if (object?.type === 'message' && this.#alarmService.isAlarm(object)) {
            _object = this.#alarmService.parseAlarm(object)
          }
          if (previousObj?.type === 'message' && this.#alarmService.isAlarm(previousObj)) {
            _prevObject = this.#alarmService.parseAlarm(previousObj)
          }
        }

        if (fields.trim() === '') {
          fields = '*'
        }

        if (fields !== '*') {
          _object = pick(_object, fields.split(','))
          _prevObject = pick(_prevObject, fields.split(','))
        }

        if (event === 'update' && isEqual(_object, _prevObject)) {
          // if no changes from user perspective, don't send update
          return
        }

        const data = event === 'remove' ? _prevObject! : _object!
        this.sendData(id, { event, data })
      }

    const handleAdd = handleXapiEvent('add')
    const handleUpdate = handleXapiEvent('update')
    const handleRemove = handleXapiEvent('remove')
    ee.on('add', handleAdd)
    ee.on('update', handleUpdate)
    ee.on('remove', handleRemove)

    const subscriptionId = crypto.randomUUID() as SseSubscriptionId

    const unsubscribe = () => {
      ee.removeListener('add', handleAdd)
      ee.removeListener('update', handleUpdate)
      ee.removeListener('remove', handleRemove)
      const _client = this.#clients.get(id)
      if (_client === undefined) {
        return
      }
      delete _client.subscriptions[subscriptionId]
      this.#clients.set(id, _client)
    }

    client.subscriptions[subscriptionId] = {
      collection,
      unsubscribe,
      fields,
    }
    this.#clients.set(id, client)

    return subscriptionId
  }

  unsubscribe(clientId: SseConnectionId, subId: SseSubscriptionId): void {
    const client = this.#clients.get(clientId)
    if (client === undefined) {
      throw new ApiError(`no SSE client found for ID: ${clientId}`, 404)
    }

    client.subscriptions[subId]?.unsubscribe()
  }

  sendData(
    id: SseConnectionId,
    { event, data }: { event: 'init' | 'ping' | 'add' | 'update' | 'remove'; data: object }
  ): void {
    const connection = this.#clients.get(id)?.connection
    if (connection === undefined) {
      throw new ApiError(`no connection found with ID: ${id}`, 404)
    }

    connection.write(`event:${event}\n`)
    connection.write(`data:${JSON.stringify(data)}\n\n`)
  }

  #removeSseClient(id: SseConnectionId) {
    log.debug(`remove SSE client: ${id}`)
    const client = this.#clients.get(id)
    if (client === undefined) {
      return
    }
    if (!client.connection.closed) {
      client.connection.destroy()
    }

    for (const featureName in client.intervalByFeatureName) {
      log.debug('clear interval for: ', featureName)
      clearInterval(client.intervalByFeatureName[featureName])
      delete client.intervalByFeatureName[featureName]
    }

    for (const id in client.subscriptions) {
      log.debug('clear subscription for: ', id)
      client.subscriptions[id].unsubscribe()
    }

    this.#clients.delete(id)
    log.debug(`nb client remaining: ${this.#clients.size}`)
  }
}
