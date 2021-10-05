import { VhdFile, VhdDirectory } from './'

export const openVhd = async (handler, path) => {
  let src
  try {
    src = await VhdFile.open(handler, path)
  } catch (e) {
    if (e.code === 'EISDIR') {
      src = await VhdDirectory.open(handler, path)
    } else {
      throw e
    }
  }
  return src
}
