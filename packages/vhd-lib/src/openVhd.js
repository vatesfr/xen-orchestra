import { VhdFile, VhdDirectory } from './'

export async function openVhd(handler, path) {
  try {
    return await VhdFile.open(handler, path)
  } catch (e) {
    if (e.code !== 'EISDIR') {
      throw e
    }
    return await VhdDirectory.open(handler, path)
  }
}
