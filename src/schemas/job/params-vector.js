export default {
  $schema: 'http://json-schema.org/draft-04/schema#',
  type: 'object',
  properties: {
    type: {
      enum: ['crossProduct']
    },
    items: {
      type: 'array',
      description: 'vector of values to multiply with others vectors',
      items: {
        type: 'object',
        properties: {
          type: {
            enum: ['set']
          },
          values: {
            type: 'array',
            items: {
              type: 'object'
            },
            minItems: 1
          }
        },
        required: [
          'type',
          'values'
        ]
      },
      minItems: 1
    }
  },
  required: [
    'type',
    'items'
  ]
}

/* Example:
{
  "type": "cross product",
  "items": [
    {
      "type": "set",
      "values":  [
        {"id": 0, "name": "snapshost de 0"},
        {"id": 1, "name": "snapshost de 1"}
      ],
    },
    {
      "type": "set",
      "values": [
        {"force": true}
      ]
    }
  ]
}

*/
