export async function add ({tag, id}) {
  await this.getXAPI(id).addTag(id, tag)
}

add.description = 'add a new tag to an object'

add.resolve = {
  object: ['id', null, 'administrate']
}

add.params = {
  tag: { type: 'string' },
  id: { type: 'string' }
}

// -------------------------------------------------------------------

export async function remove ({tag, id}) {
  await this.getXAPI(id).removeTag(id, tag)
}

remove.description = 'remove an existing tag from an object'

remove.resolve = {
  object: ['id', null, 'administrate']
}

remove.params = {
  tag: { type: 'string' },
  id: { type: 'string' }
}
