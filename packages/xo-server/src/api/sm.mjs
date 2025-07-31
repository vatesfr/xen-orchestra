export async function getFromSr({ sr }) {
  return this.getXapi(sr).getSmFromSrType(sr.SR_type)
}

getFromSr.description = 'Get SM from SR Type'

getFromSr.params = {
  sr: { type: 'string' },
}

getFromSr.resolve = {
  sr: ['sr', 'SR', 'view'],
}
