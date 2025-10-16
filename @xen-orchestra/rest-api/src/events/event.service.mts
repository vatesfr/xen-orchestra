import crypto from 'node:crypto'
import { Branded } from '@vates/types'
import { createLogger } from '@xen-orchestra/log'
import type { Response } from 'express'

import { ApiError } from '../helpers/error.helper.mjs'

type SseConnectionId = Branded<'SSE'>

const log = createLogger('xo:rest-api:event-service')

export class EventService {
  #clients: Map<
    SseConnectionId,
    {
      connection: Response
      intervalByFeatureName: Record<string, NodeJS.Timeout>
    }
  > = new Map()

  constructor() {
    process.on('SIGTERM', () => {
      log.debug(`SIGTERM received, close all SSE clients (nb: ${this.#clients.size})`)
      this.#clients.forEach((_, id) => this.#removeSseClient(id))
    })
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
    })
    log.debug(`new SSE client added: ${id}`)
    log.debug(`nb client: ${this.#clients.size}`)
    return id
  }

  sendData(id: SseConnectionId, { event, data }: { event: string; data: object }): void {
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

    this.#clients.delete(id)
    log.debug(`nb client remaining: ${this.#clients.size}`)
  }
}
