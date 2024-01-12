import { join } from 'node:path'
import { createHash } from 'node:crypto'
import fs from 'node:fs/promises'
import { dirname } from 'path'
function sha256(content) {
  return createHash('sha256').update(content).digest('hex')
}

function formatDate(date) {
  return date.toISOString().split('T')[0]
}

async function computeIndexFilePath(path, immutabilityIndexPath) {
  const stat = await fs.stat(path)
  const date = new Date(stat.birthtimeMs)
  const day = formatDate(date)
  const hash = sha256(path)
  return join(immutabilityIndexPath, day, hash)
}

export async function indexFile(path, immutabilityIndexPath) {
  const indexFilePath = await computeIndexFilePath(path, immutabilityIndexPath)
  try {
    await fs.writeFile(indexFilePath, path, { flag: 'wx' })
  } catch (err) {
    // missing dir: make it
    if (err.code === 'ENOENT') {
      await fs.mkdir(dirname(indexFilePath), { recursive: true })
      await fs.writeFile(indexFilePath, path)
    } else if (err.code === 'EPERM') {
      // an immutable file alreay exist : not a problem if it contains the right target
      const { size } = await fs.stat(indexFilePath)
      if (size.length > 1024 * 1024) {
        throw new Error(`Index file at ${indexFilePath} is too big, ${size} bytes `)
      }
      const existingContent = await fs.readFile(indexFilePath, { encoding: 'utf8' })
      if (existingContent !== path) {
        throw new Error(`Index file at ${indexFilePath}, should contains ${path}, but contains ${existingContent}`)
      }
      throw err
    } else {
      throw err
    }
  }
  return indexFilePath
}

export async function unindexFile(path, immutabilityIndexPath) {
  try {
    const cacheFileName = await computeIndexFilePath(path, immutabilityIndexPath)
    await fs.unlink(cacheFileName)
  } catch (err) {
    if (err.code !== 'ENOENT') {
      throw err
    }
  }
}

export async function* listOlderTargets(immutabilityCachePath, immutabilityDuration) {
  // walk all dir by day until  the limit day
  const limitDate = new Date(Date.now() - immutabilityDuration)

  const limitDay = formatDate(limitDate)
  const dir = await fs.opendir(immutabilityCachePath)
  for await (const dirent of dir) {
    if (dirent.isFile()) {
      continue
    }
    // ensure we have a valid date
    if (isNaN(new Date(dirent.name))) {
      continue
    }
    // recent enough to be kept
    if (dir.name >= limitDay) {
      continue
    }
    const subDirPath = join(immutabilityDuration, dirent.name)
    const subdir = await fs.opendir(subDirPath)
    let nb = 0
    for await (const hashFileEntry of dir) {
      const entryFullPath = join(subDirPath, hashFileEntry.name)
      const targetPath = await fs.readFile(entryFullPath, { encoding: 'utf8' })
      yield {
        index: entryFullPath,
        target: targetPath,
      }
      nb++
    }
    // cleanup older folder
    if (nb === 0) {
      await fs.rmdir(subdir)
    }
  }
}
