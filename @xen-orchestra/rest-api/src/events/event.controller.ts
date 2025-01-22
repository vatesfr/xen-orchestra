import { Request as ExRequest } from 'express'
import { getRestApi } from '../index.js'
import { Controller, Get, Request, Route } from 'tsoa'

@Route('events')
export class EventsController extends Controller {
  /**
   *  subscribe to all evenements
   */
  @Get()
  public async getServers(@Request() req: ExRequest): Promise<void> {
    const restApi = getRestApi()

    const res = req.res!

    res.setHeader('Access-Control-Allow-Origin', '*') // TODO: remove this. Only used for test

    res.setHeader('Content-Type', 'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Connection', 'keep-alive')

    res.write(`data:${JSON.stringify({ data: null, operation: 'initial' })}\n\n`)

    const symbol = Symbol('client-id')
    restApi.addSseClient(symbol, res)

    res.on('close', () => {
      restApi.removeSseClient(symbol)
      res.end()
    })
  }
}
