const KEY_PREFIX = 'XenCenter.CustomFields.'

export async function add({ object, name, value }) {
  await this.getXapiObject(object).$call('add_to_other_config', KEY_PREFIX + name, value)
}

add.description = 'Add a new custom field to an object'

add.params = {
  id: { type: 'string' },
  name: { type: 'string' },
  value: { type: 'string' },
}

add.resolve = {
  object: ['id', null, 'administrate'],
}

// -------------------------------------------------------------------

export async function remove({ object, name }) {
  await this.getXapiObject(object).update_other_config(KEY_PREFIX + name, null)
}

remove.description = 'Remove an existing custom field from an object'

remove.params = {
  id: { type: 'string' },
  name: { type: 'string' },
}

remove.resolve = {
  object: ['id', null, 'administrate'],
}

// -------------------------------------------------------------------

export async function set({ object, name, value }) {
  await this.getXapiObject(object).update_other_config(KEY_PREFIX + name, value)
}

set.description = 'Set a custom field'

set.params = {
  id: { type: 'string' },
  name: { type: 'string' },
  value: { type: 'string' },
}

set.resolve = {
  object: ['id', null, 'administrate'],
}
