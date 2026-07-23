import { dirname, relative, resolve } from 'node:path'
import type { FileAccessor } from './FileAccessor.mjs'

export const ALIAS_MAX_PATH_LENGTH = 1024

export class DiskAliasError extends Error {}
export class AliasMissingError extends DiskAliasError {
  code = 'ENOENT'
}
export class AliasIsDirectoryError extends DiskAliasError {
  code = 'EISDIR'
}
export class AliasChainError extends DiskAliasError {}
export class AliasTooLongError extends DiskAliasError {}

function resolveRelativeFromFile(file: string, targetPath: string): string {
  if (file.startsWith('/')) {
    return resolve(dirname(file), targetPath)
  }
  return resolve('/', dirname(file), targetPath).slice(1)
}

/**
 * an alias is a small text file containing the path, relative to itself,
 * of the disk (file or directory) it points to
 */
export class DiskAlias {
  #extension: string

  constructor(extension: string) {
    this.#extension = extension
  }

  get suffix(): string {
    return `.alias.${this.#extension}`
  }

  isAlias(filename: string): boolean {
    return filename.endsWith(this.suffix)
  }

  async resolve(handler: FileAccessor, filename: string): Promise<string> {
    if (!this.isAlias(filename)) {
      return filename
    }

    let aliasContent: string
    try {
      aliasContent = (await handler.readFile(filename)).toString().trim()
    } catch (err: any) {
      if (err.code === 'ENOENT') {
        throw new AliasMissingError(`The alias file ${filename} does not exist`)
      }
      if (err.code === 'EISDIR') {
        throw new AliasIsDirectoryError(`The alias file ${filename} is a directory`)
      }
      throw err
    }

    if (!handler.isEncrypted && aliasContent.length > ALIAS_MAX_PATH_LENGTH) {
      throw new AliasTooLongError(`The alias file ${filename} is too long (${aliasContent.length} chars)`)
    }

    // also handle circular references and unreasonably long chains
    if (this.isAlias(aliasContent)) {
      throw new AliasChainError(`Chaining alias is forbidden ${filename} to ${aliasContent}`)
    }

    // the target is relative to the alias location
    return resolveRelativeFromFile(filename, aliasContent)
  }

  async create(handler: FileAccessor, aliasPath: string, targetPath: string): Promise<void> {
    if (!this.isAlias(aliasPath)) {
      throw new DiskAliasError(`Alias must be named *${this.suffix}, ${aliasPath} given`)
    }
    if (this.isAlias(targetPath)) {
      throw new AliasChainError(`Chaining alias is forbidden ${aliasPath} to ${targetPath}`)
    }

    // aliasPath and targetPath are absolute path from the root of the handler
    // normalize them so they can't escape this dir
    const aliasDir = dirname(resolve('/', aliasPath))
    // only store the relative path from alias to target
    const relativePathToTarget = relative(aliasDir, resolve('/', targetPath))

    if (relativePathToTarget.length > ALIAS_MAX_PATH_LENGTH) {
      throw new AliasTooLongError(
        `Alias relative path ${relativePathToTarget} is too long : ${relativePathToTarget.length} chars, max is ${ALIAS_MAX_PATH_LENGTH}`
      )
    }
    await handler.writeFile(aliasPath, relativePathToTarget)
  }

  async unlink(handler: FileAccessor, path: string): Promise<void> {
    let resolved = path
    try {
      resolved = await this.resolve(handler, path)
    } catch (err) {
      // broken alias (named like an alias but is actually a directory) must still be unlinkable
      if (!(err instanceof AliasIsDirectoryError)) {
        throw err
      }
    }

    try {
      await handler.unlink(resolved)
    } catch (err: any) {
      if (err.code === 'EISDIR') {
        await handler.rmtree(resolved)
      } else {
        throw err
      }
    }

    // also delete the alias file
    if (path !== resolved) {
      await handler.unlink(path)
    }
  }
}
