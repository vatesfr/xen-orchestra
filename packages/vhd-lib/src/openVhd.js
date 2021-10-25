import { VhdFile, VhdDirectory } from './'

export async function openVhd(handler, path) {
  try {
    if (path.endsWith('.alias.vhd')) {
      const buf = Buffer.from(await handler.readFile(path), 'utf-8')
      const aliasContent = buf.toString().trim()
      return openVhd(handler, aliasContent)
    }
    return await VhdFile.open(handler, path)
  } catch (e) {
    if (e.code !== 'EISDIR') {
      throw e
    }
    return await VhdDirectory.open(handler, path)
  }
}
