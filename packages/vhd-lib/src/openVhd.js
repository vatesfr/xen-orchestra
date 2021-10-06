import { VhdFile, VhdDirectory } from './'

export const openVhd = async function (handler, path) {
  try {
    return await VhdFile.open(handler, path)
  } catch (e) {
    if (e.code !== 'EISDIR') {
      throw e
    }
    return await VhdDirectory.open(handler, path)
  }
}
