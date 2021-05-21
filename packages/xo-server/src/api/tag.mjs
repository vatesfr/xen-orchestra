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
