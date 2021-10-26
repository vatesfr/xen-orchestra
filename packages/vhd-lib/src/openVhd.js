import { resolveAlias } from './_resolveAlias'
import { VhdFile, VhdDirectory } from './'

export async function openVhd(handler, path) {
  const resolved = await resolveAlias(handler, path)
  try {
    return await VhdFile.open(handler, resolved)
  } catch (e) {
    if (e.code !== 'EISDIR') {
      throw e
    }
    return await VhdDirectory.open(handler, resolved)
  }
}
