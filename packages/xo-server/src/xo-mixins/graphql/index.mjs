import bodyParser from 'body-parser'
import { GraphQLSchema, printSchema } from 'graphql'

import XapiGraphQlBackend from './schema.mjs'
import { createHandler } from 'graphql-http/lib/use/express'
import { useServer } from 'graphql-ws/lib/use/ws'
import { WebSocketServer } from 'ws' // yarn add ws
import fs from 'node:fs/promises'

export default class GraphQlApi {
  constructor(app, { express, ...other }) {
    if (express === undefined) {
      return
    }
    // console.log(Object.keys(other))
    const schema = new GraphQLSchema(new XapiGraphQlBackend(app))
    const webSocketServer = new WebSocketServer({
      server: express,
      path: '/graphql/v0',
    })

    useServer({ schema }, webSocketServer)
    fs.writeFile('./schema.graphql', printSchema(schema)).catch(console.error)
    const handler = createHandler({ schema })
    express.use('/graphql/v0', bodyParser.json())
    express.all('/graphql/v0', handler)
  }
}
