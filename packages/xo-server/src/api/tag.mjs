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

export async function addTagColor({ tag, color }) {
  await this.addTagColor(tag, color)
}

addTagColor.description = 'Add a color to a tag'

addTagColor.params = {
  tag: { type: 'string' },
  color: { type: 'string' },
}

addTagColor.permission = 'admin'

export async function deleteTagColor({ id }) {
  await this.deleteTagColor(id)
}

deleteTagColor.description = 'Delete a color to a tag'

deleteTagColor.params = {
  id: { type: 'string' },
}

deleteTagColor.permission = 'admin'

export async function getTagColorsByTag() {
  return keyBy(await this.getTagColors(), 'tag')
}

getTagColorsByTag.description = 'Get tag colors by tag'
