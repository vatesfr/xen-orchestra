export default {
  $schema: 'http://json-schema.org/draft-04/schema#',
  type: 'object',
  properties: {
    id: {
      type: 'string',
      description: 'unique identifier for this ACL',
    },
    action: {
      type: 'string',
      description: 'permission (or role)',
    },
    object: {
      type: 'string',
      description: 'item (or set)',
    },
    subject: {
      type: 'string',
      description: 'user (or group)',
    },
  },
  required: ['id', 'action', 'object', 'subject'],
}
