import bodyParser from 'body-parser'
import { GraphQLSchema } from 'graphql'

import XapiGraphQlBackend from './schema.mjs'
import { createHandler } from 'graphql-http/lib/use/express'

export default class GraphQlApi {
  constructor(app, { express }) {
    if (express === undefined) {
      return
    }
    const schema = new GraphQLSchema(new XapiGraphQlBackend(app))
    const handler = createHandler({ schema })
    express.use('/graphql/V0', bodyParser.json())
    express.all('/graphql/V0', handler)
  }
}
