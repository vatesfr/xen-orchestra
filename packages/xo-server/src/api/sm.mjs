export async function get({ id, type }) {
  return this.getXapi(id).getSmFromSrType(type)
}

get.description = 'Get SM from SR Type'

get.params = {
  id: { type: 'string' },
  type: { type: 'string' },
}

get.resolve = {
  sr: ['sr', 'SR', 'view'],
}
