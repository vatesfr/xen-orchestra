import * as CM from 'complex-matcher'
import { noSuchObject } from 'xo-common/api-errors.js'

const RECORD_FIELDS = {
  data: {
    type: 'object',
    fields: {
      method: { type: 'string', example: 'vm.start' },
      params: { type: 'object', fields: {} },
    },
  },
  event: { type: 'string', example: 'apiCall' },
  id: { type: 'string', example: 'FYUYLGWX0uUv6uKyDpc6ftAJhrEB7iuf/BYefEbBLYc=' },
  previousId: { type: 'string', example: 'ArU8U8Ck2u4dBBHc3wj0/Ht+SsyU8YKb5RfnFqBLZ2Y=' },
  subject: {
    type: 'object',
    fields: {
      userId: { type: 'string', example: '2f8f6c95-2fb7-4b5c-9b6f-8f4e7b6a1c3d' },
      userIp: { type: 'string', example: '192.168.0.1' },
      userName: { type: 'string', example: 'admin@admin.net' },
    },
  },
  time: { type: 'number', example: 1699000000000 },
}
const RECORD_FIELDS_ARRAY = {
  type: 'array',
  items: { type: 'object', fields: RECORD_FIELDS },
}

function makeRecordMapper(req) {
  const href = record => `${req.baseUrl}${req.path}/${record.id}`
  const { fields } = req.query

  if (fields === '*') {
    return record => ({ ...record, href: href(record) })
  }
  if (typeof fields === 'string') {
    const keys = fields.split(',')
    return record => {
      const picked = {}
      for (const key of keys) {
        if (key in record) picked[key] = record[key]
      }
      return { ...picked, href: href(record) }
    }
  }
  return href
}

export function createRestRoutes(plugin) {
  return [
    {
      endpoint: '/records',
      method: 'get',
      description: 'List audit records, newest first',
      tags: ['audit'],
      query: {
        from: { type: 'string', optional: true, example: 'FYUYLGWX0uUv6uKyDpc6ftAJhrEB7iuf/BYefEbBLYc=' },
        limit: { type: 'number', optional: true, example: 100 },
        filter: { type: 'string', optional: true, example: 'event:apiCall' },
        fields: { type: 'string', optional: true, example: '*' },
      },
      responses: [{ status: 200, description: 'The list of audit records', schema: RECORD_FIELDS_ARRAY }],
      callback: async function* ({ req }) {
        const { query } = req
        const limit = query.limit === undefined ? Infinity : +query.limit
        const filter = query.filter === undefined ? () => true : CM.parse(query.filter).createPredicate()
        const mapRecord = makeRecordMapper(req)

        let i = 0
        for await (const record of plugin._auditCore.getFrom(query.from)) {
          if (++i > limit) {
            break
          }

          if (filter(record)) {
            yield mapRecord(record)
          }
        }
      },
    },
    {
      endpoint: '/records/{id}',
      method: 'get',
      description: 'Get a single audit record by its ID',
      tags: ['audit'],
      params: {
        id: { type: 'string', example: 'FYUYLGWX0uUv6uKyDpc6ftAJhrEB7iuf/BYefEbBLYc=' },
      },
      responses: [
        { status: 200, description: 'The audit record', schema: RECORD_FIELDS },
        { status: 404, description: 'No record found for this ID' },
      ],
      callback: async ({ req }) => {
        const record = await plugin._auditCore.get(req.params.id)
        if (record === undefined) {
          throw noSuchObject(req.params.id, 'audit-record')
        }
        return record
      },
    },
  ]
}
