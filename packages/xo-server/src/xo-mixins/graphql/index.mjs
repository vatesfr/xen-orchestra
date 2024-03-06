import bodyParser from 'body-parser'
import schema from './schema.mjs'
import { createHandler } from 'graphql-http/lib/use/express'

export default class GraphQlApi {
  constructor(app, { express }) {
    if (express === undefined) {
      return
    }
    const handler = createHandler({ schema })
    express.use('/graphql/V0', bodyParser.json())
    express.all('/graphql/V0', handler)
  }
}
