export default {
  $schema: 'http://json-schema.org/draft-04/schema#',
  type: 'object',
  properties: {
    id: {
      type: 'string',
      description: 'unique identifier for this user',
    },
    email: {
      type: 'string',
      description: 'email address of this user',
    },
    groups: {
      type: 'array',
      items: {
        type: 'string',
      },
      description: 'identifier of groups this user belong to',
    },
    permission: {
      enum: ['none', 'read', 'write', 'admin'],
      description: 'root permission for this user, none and admin are the only significant ones',
    },
    preferences: {
      type: 'object',
      properties: {
        lang: { type: 'string' },
        sshKeys: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              key: { type: 'string' },
              title: { type: 'string' },
            },
            required: ['key', 'title'],
          },
        },
      },
      description: 'various user preferences',
    },
    authProviders: {
      type: 'object',
    },
  },
  required: ['id', 'email'],
}
