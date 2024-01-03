import keyBy from 'lodash/keyBy.js'

export async function add({ tag, object }) {
  await this.getXapiObject(object).add_tags(tag)
}

add.description = 'add a new tag to an object'

add.resolve = {
  object: ['id', null, 'administrate'],
}

add.params = {
  tag: { type: 'string' },
  id: { type: 'string' },
}

// -------------------------------------------------------------------

export async function remove({ tag, object }) {
  await this.getXapiObject(object).remove_tags(tag)
}

remove.description = 'remove an existing tag from an object'

remove.resolve = {
  object: ['id', null, 'administrate'],
}

remove.params = {
  tag: { type: 'string' },
  id: { type: 'string' },
}

// -------------------------------------------------------------------

export async function set({ id, ...params }) {
  await this.setTag(id, params)
}

set.description = 'Set a tag configuration'

set.params = {
  id: { type: 'string' },
  color: { type: ['string', 'null'], optional: true },
}

set.permission = 'admin'

export async function getAllConfigured() {
  return keyBy(await this.getConfiguredTags(), 'id')
}

getAllConfigured.description = 'Get all configured tags'
