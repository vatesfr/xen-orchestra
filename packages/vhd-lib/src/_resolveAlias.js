import { ALIAS_MAX_PATH_LENGTH } from './_constants'
import resolveRelativeFromFile from './_resolveRelativeFromFile'

export function isVhdAlias(filename) {
  return filename.endsWith('.alias.vhd')
}

export async function resolveAlias(handler, filename) {
  if (!isVhdAlias(filename)) {
    return filename
  }
  const size = await handler.getSize(filename)
  if (size > ALIAS_MAX_PATH_LENGTH) {
    // seems reasonnable for a relative path
    throw new Error(`The alias file ${filename} is too big (${size} bytes)`)
  }
  const aliasContent = (await handler.readFile(filename)).toString().trim()
  // also handle circular references and unreasonnably long chains
  if (isVhdAlias(aliasContent)) {
    throw new Error(`Chaining alias is forbidden ${filename} to ${aliasContent}`)
  }
  // the target is relative to the alias location
  return resolveRelativeFromFile(filename, aliasContent)
}
