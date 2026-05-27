import * as CM from 'complex-matcher'

const RECORD_FIELDS = {
  data: { type: 'object', fields: {} },
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
  results: {
    type: 'array',
    items: { type: 'object', fields: RECORD_FIELDS },
    example: [
      {
        data: {},
        event: 'apiCall',
        id: 'FYUYLGWX0uUv6uKyDpc6ftAJhrEB7iuf/BYefEbBLYc=',
        previousId: 'ArU8U8Ck2u4dBBHc3wj0/Ht+SsyU8YKb5RfnFqBLZ2Y=',
        subject: {
          userId: '2f8f6c95-2fb7-4b5c-9b6f-8f4e7b6a1c3d',
          userIp: '192.168.0.1',
          userName: 'admin@admin.net',
        },
        time: 1699000000000,
      },
      {
        data: {},
        event: 'apiCall',
        id: 'ArU8U8Ck2u4dBBHc3wj0/Ht+SsyU8YKb5RfnFqBLZ2Y=',
        previousId: 'FYUYLGWX0uUv6uKyDpc6ftAJhrEB7iuf/BYefEbBLYc=',
        subject: {
          userId: '7b1e4d2c-9a3f-4c8e-b5d6-1f2a3b4c5d6e',
          userIp: '192.168.0.2',
          userName: 'user@admin.net',
        },
        time: 1699000060000,
      },
    ],
  },
}

export function createRestApi(auditCore) {
  return [
    [
      {
        endpoint: '/records',
        method: 'get',
        description: 'List audit records, newest first',
        tags: ['audit'],
        query: {
          from: { type: 'string', optional: true },
          limit: { type: 'string', optional: true },
          filter: { type: 'string', optional: true },
        },
        responses: [{ status: 200, description: 'The list of audit records', schema: RECORD_FIELDS_ARRAY }],
        callback: async function* ({ req }) {
          const { query } = req
          const limit = query.limit === undefined ? Infinity : +query.limit
          const filter = query.filter === undefined ? () => true : CM.parse(query.filter).createPredicate()

          let i = 0
          for await (const record of auditCore.getFrom(query.from)) {
            if (++i > limit) {
              break
            }

            if (filter(record)) {
              yield record
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
          id: { type: 'string' },
        },
        responses: [
          { status: 200, description: 'The audit record', schema: RECORD_FIELDS },
          { status: 404, description: 'No record found for this ID' },
        ],
        callback: async ({ req, next }) => {
          const record = await auditCore.get(req.params.id)
          if (record !== undefined) {
            return record
          }
          next()
        },
      },
    ],
    '/plugins/audit',
  ]
}
