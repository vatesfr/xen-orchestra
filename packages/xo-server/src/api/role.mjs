export async function getAll() {
  return /* await */ this.getRoles()
}

getAll.description = 'Returns the list of all existing roles'
