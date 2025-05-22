import * as UUID from 'uuid'
import sum from 'lodash/sum.js'
import { asyncMap } from '@xen-orchestra/async-map'
import { Constants, openVhd, VhdAbstract, VhdFile } from 'vhd-lib'
import { isVhdAlias, resolveVhdAlias } from 'vhd-lib/aliases.js'
import { basename, dirname, resolve } from 'node:path'
import { isMetadataFile, isVhdFile, isXvaFile, isXvaSumFile } from './_backupType.mjs'
import { limitConcurrency } from 'limit-concurrency-decorator'
import { mergeVhdChain } from 'vhd-lib/merge.js'

import { Task } from './Task.mjs'
import { Disposable } from 'promise-toolbox'
import handlerPath from '@xen-orchestra/fs/path'

const { DISK_TYPES } = Constants

// checking the size of a vhd directory is costly
// 1 Http Query per 1000 blocks
// we only check size of all the vhd are VhdFiles
function shouldComputeVhdsSize(handler, vhds) {
  if (handler.isEncrypted) {
    return false
  }
  return vhds.every(vhd => vhd instanceof VhdFile)
}

const computeVhdsSize = (handler, vhdPaths) =>
  Disposable.use(
    vhdPaths.map(vhdPath => openVhd(handler, vhdPath)),
    async vhds => {
      if (shouldComputeVhdsSize(handler, vhds)) {
        const sizes = await asyncMap(vhds, vhd => vhd.getSize())
        return sum(sizes)
      }
    }
  )

// chain is [ ancestor, child_1, ..., child_n ]
async function _mergeVhdChain(handler, chain, { logInfo, remove, mergeBlockConcurrency }) {
  logInfo(`merging VHD chain`, { chain })

  let done, total
  const handle = setInterval(() => {
    if (done !== undefined) {
      logInfo('merge in progress', {
        done,
        parent: chain[0],
        progress: Math.round((100 * done) / total),
        total,
      })
    }
  }, 10e3)
  try {
    return await mergeVhdChain(handler, chain, {
      logInfo,
      mergeBlockConcurrency,
      onProgress({ done: d, total: t }) {
        done = d
        total = t
      },
      removeUnused: remove,
    })
  } finally {
    clearInterval(handle)
  }
}

const noop = Function.prototype

const INTERRUPTED_VHDS_REG = /^\.(.+)\.merge.json$/
const listVhds = async (handler, vmDir, logWarn) => {
  const vhds = new Set()
  const aliases = {}
  const interruptedVhds = new Map()

  await asyncMap(
    await handler.list(`${vmDir}/vdis`, {
      ignoreMissing: true,
      prependDir: true,
    }),
    async jobDir =>
      asyncMap(
        await handler.list(jobDir, {
          prependDir: true,
        }),
        async vdiDir => {
          const list = await handler.list(vdiDir, {
            filter: file => isVhdFile(file) || INTERRUPTED_VHDS_REG.test(file),
          })
          aliases[vdiDir] = list.filter(vhd => isVhdAlias(vhd)).map(file => `${vdiDir}/${file}`)

          await asyncMap(list, async file => {
            const res = INTERRUPTED_VHDS_REG.exec(file)
            if (res === null) {
              vhds.add(`${vdiDir}/${file}`)
            } else {
              try {
                const mergeState = JSON.parse(await handler.readFile(`${vdiDir}/${file}`))
                interruptedVhds.set(`${vdiDir}/${res[1]}`, {
                  statePath: `${vdiDir}/${file}`,
                  chain: mergeState.chain,
                })
              } catch (error) {
                // fall back to a non resuming merge
                vhds.add(`${vdiDir}/${file}`)
                logWarn('failed to read existing merge state', { path: file, error })
              }
            }
          })
        }
      )
  )

  return { vhds, interruptedVhds, aliases }
}

export async function checkAliases(
  aliasPaths,
  targetDataRepository,
  { handler, logInfo = noop, logWarn = console.warn, remove = false }
) {
  const aliasFound = []
  for (const alias of aliasPaths) {
    let target
    try {
      target = await resolveVhdAlias(handler, alias)
    } catch (err) {
      if (err.code === 'ENOENT') {
        logWarn('missing target of alias', { alias })
        if (remove) {
          logInfo('removing alias and non VHD target', { alias, target })
          await handler.unlink(alias)
        }
        continue
      }
      if (err.code === 'EISDIR') {
        logWarn('alias is a vhd directory', { alias })
        if (remove) {
          logInfo('removing vhd directory named as alias', { alias, target })
          await VhdAbstract.unlink(handler, alias)
        }
        continue
      }
      logWarn('unhandled error while checking alias', { alias, err })
      continue
    }

    if (target === '') {
      logWarn('empty target for alias ', { alias })
      if (remove) {
        logInfo('removing alias and non VHD target', { alias, target })
        await handler.unlink(alias)
      }
      continue
    }

    if (!isVhdFile(target)) {
      logWarn('alias references non VHD target', { alias, target })
      if (remove) {
        logInfo('removing alias and non VHD target', { alias, target })
        await handler.unlink(target)
        await handler.unlink(alias)
      }
      continue
    }

    try {
      const { dispose } = await openVhd(handler, target)
      try {
        await dispose()
      } catch (e) {
        // error during dispose should not trigger a deletion
      }
    } catch (error) {
      logWarn('missing or broken alias target', { alias, target, error })
      if (remove) {
        try {
          await VhdAbstract.unlink(handler, alias)
        } catch (error) {
          if (error.code !== 'ENOENT') {
            logWarn('error deleting alias target', { alias, target, error })
          }
        }
      }
      continue
    }

    aliasFound.push(resolve('/', target))
  }

  const vhds = await handler.list(targetDataRepository, {
    ignoreMissing: true,
    prependDir: true,
  })

  await asyncMap(vhds, async path => {
    if (!aliasFound.includes(path)) {
      logWarn('no alias references VHD', { path })
      if (remove) {
        logInfo('deleting unused VHD', { path })
        await VhdAbstract.unlink(handler, path)
      }
    }
  })
}

const defaultMergeLimiter = limitConcurrency(1)

export async function cleanVm(
  vmDir,
  {
    fixMetadata,
    remove = false,
    removeTmp = remove,
    merge,
    mergeBlockConcurrency,
    mergeLimiter = defaultMergeLimiter,
    logInfo = noop,
    logWarn = console.warn,
  }
) {
  const limitedMergeVhdChain = mergeLimiter(_mergeVhdChain)

  const handler = this._handler

  const vhdsToJSons = new Set()
  const vhdById = new Map()
  const vhdParents = { __proto__: null }
  const vhdChildren = { __proto__: null }

  const { vhds, interruptedVhds, aliases } = await listVhds(handler, vmDir, logWarn)

  // remove broken VHDs
  await asyncMap(vhds, async path => {
    if (removeTmp && basename(path)[0] === '.') {
      logInfo('deleting temporary VHD', { path })
      return VhdAbstract.unlink(handler, path)
    }
    try {
      await Disposable.use(openVhd(handler, path, { checkSecondFooter: !interruptedVhds.has(path) }), vhd => {
        if (vhd.footer.diskType === DISK_TYPES.DIFFERENCING) {
          const parent = resolve('/', dirname(path), vhd.header.parentUnicodeName)
          vhdParents[path] = parent
          if (parent in vhdChildren) {
            const error = new Error('this script does not support multiple VHD children')
            error.parent = parent
            error.child1 = vhdChildren[parent]
            error.child2 = path
            throw error // should we throw?
          }
          vhdChildren[parent] = path
        }
        // Detect VHDs with the same UUIDs
        //
        // Due to a bug introduced in a1bcd35e2
        const duplicate = vhdById.get(UUID.stringify(vhd.footer.uuid))
        let vhdKept = vhd
        if (duplicate !== undefined) {
          logWarn('uuid is duplicated', { uuid: UUID.stringify(vhd.footer.uuid) })
          if (duplicate.containsAllDataOf(vhd)) {
            logWarn(`should delete ${path}`)
            vhdKept = duplicate
            vhds.delete(path)
          } else if (vhd.containsAllDataOf(duplicate)) {
            logWarn(`should delete ${duplicate._path}`)
            vhds.delete(duplicate._path)
          } else {
            logWarn('same ids but different content')
          }
        }
        vhdById.set(UUID.stringify(vhdKept.footer.uuid), vhdKept)
      })
    } catch (error) {
      vhds.delete(path)
      logWarn('VHD check error', { path, error })
      if (error?.code === 'ERR_ASSERTION' && remove) {
        logInfo('deleting broken VHD', { path })
        return VhdAbstract.unlink(handler, path)
      }
    }
  })

  // remove interrupted merge states for missing VHDs
  for (const interruptedVhd of interruptedVhds.keys()) {
    if (!vhds.has(interruptedVhd)) {
      const { statePath } = interruptedVhds.get(interruptedVhd)
      interruptedVhds.delete(interruptedVhd)

      logWarn('orphan merge state', {
        mergeStatePath: statePath,
        missingVhdPath: interruptedVhd,
      })
      if (remove) {
        logInfo('deleting orphan merge state', { statePath })
        await handler.unlink(statePath)
      }
    }
  }

  // check if alias are correct
  // check if all vhd in data subfolder have a corresponding alias
  await asyncMap(Object.keys(aliases), async dir => {
    await checkAliases(aliases[dir], `${dir}/data`, { handler, logInfo, logWarn, remove })
  })

  // remove VHDs with missing ancestors
  {
    const deletions = []

    // return true if the VHD has been deleted or is missing
    const deleteIfOrphan = vhdPath => {
      const parent = vhdParents[vhdPath]
      if (parent === undefined) {
        return
      }

      // no longer needs to be checked
      delete vhdParents[vhdPath]

      deleteIfOrphan(parent)

      if (!vhds.has(parent)) {
        vhds.delete(vhdPath)

        logWarn('parent VHD is missing', { parent, child: vhdPath })
        if (remove) {
          logInfo('deleting orphan VHD', { path: vhdPath })
          deletions.push(VhdAbstract.unlink(handler, vhdPath))
        }
      }
    }

    // > A property that is deleted before it has been visited will not be
    // > visited later.
    // >
    // > -- https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/for...in#Deleted_added_or_modified_properties
    for (const child in vhdParents) {
      deleteIfOrphan(child)
    }

    await Promise.all(deletions)
  }

  const jsons = new Set()
  const xvas = new Set()
  const xvaSums = []
  const entries = await handler.list(vmDir, {
    prependDir: true,
  })
  entries.forEach(path => {
    if (isMetadataFile(path)) {
      jsons.add(path)
    } else if (isXvaFile(path)) {
      xvas.add(path)
    } else if (isXvaSumFile(path)) {
      xvaSums.push(path)
    }
  })

  const cachePath = vmDir + '/cache.json.gz'

  let mustRegenerateCache
  {
    const cache = await this._readCache(cachePath)
    const actual = cache === undefined ? 0 : Object.keys(cache).length
    const expected = jsons.size

    mustRegenerateCache = actual !== expected
    if (mustRegenerateCache) {
      logWarn('unexpected number of entries in backup cache', { path: cachePath, actual, expected })
    }
  }

  await asyncMap(xvas, async path => {
    // check is not good enough to delete the file, the best we can do is report
    // it
    if (!(await this.isValidXva(path))) {
      logWarn('XVA might be broken', { path })
    }
  })

  const unusedVhds = new Set(vhds)
  const unusedXvas = new Set(xvas)

  const backups = new Map()

  // compile the list of unused XVAs and VHDs, and remove backup metadata which
  // reference a missing XVA/VHD
  await asyncMap(jsons, async json => {
    let metadata
    try {
      metadata = JSON.parse(await handler.readFile(json))
    } catch (error) {
      logWarn('failed to read backup metadata', { path: json, error })
      jsons.delete(json)
      return
    }

    let isBackupComplete

    const { mode } = metadata
    if (mode === 'full') {
      const linkedXva = resolve('/', vmDir, metadata.xva)
      isBackupComplete = xvas.has(linkedXva)
      if (isBackupComplete) {
        unusedXvas.delete(linkedXva)
      } else {
        logWarn('the XVA linked to the backup is missing', { backup: json, xva: linkedXva })
      }
    } else if (mode === 'delta') {
      const linkedVhds = (() => {
        const { vhds } = metadata
        return Object.keys(vhds).map(key => resolve('/', vmDir, vhds[key]))
      })()

      const missingVhds = linkedVhds.filter(_ => !vhds.has(_))
      isBackupComplete = missingVhds.length === 0

      // FIXME: find better approach by keeping as much of the backup as
      // possible (existing disks) even if one disk is missing
      if (isBackupComplete) {
        linkedVhds.forEach(_ => unusedVhds.delete(_))
        linkedVhds.forEach(path => {
          vhdsToJSons[path] = json
        })
      } else {
        logWarn('some VHDs linked to the backup are missing', { backup: json, missingVhds })
      }
    }

    if (isBackupComplete) {
      backups.set(json, metadata)
    } else {
      jsons.delete(json)
      if (remove) {
        logInfo('deleting incomplete backup', { backup: json })
        mustRegenerateCache = true
        await handler.unlink(json)
      }
    }
  })

  // TODO: parallelize by vm/job/vdi
  const unusedVhdsDeletion = []
  const toMerge = []
  {
    // VHD chains (as list from oldest to most recent) to merge indexed by most recent
    // ancestor
    const vhdChainsToMerge = { __proto__: null }

    const toCheck = new Set(unusedVhds)

    const getUsedChildChainOrDelete = vhd => {
      if (vhd in vhdChainsToMerge) {
        const chain = vhdChainsToMerge[vhd]
        delete vhdChainsToMerge[vhd]
        return chain
      }

      if (!unusedVhds.has(vhd)) {
        return [vhd]
      }

      // no longer needs to be checked
      toCheck.delete(vhd)

      const child = vhdChildren[vhd]
      if (child !== undefined) {
        const chain = getUsedChildChainOrDelete(child)
        if (chain !== undefined) {
          chain.unshift(vhd)
          return chain
        }
      }

      // no warning because a VHD can be unused for perfectly good reasons,
      // e.g. the corresponding backup (metadata file) has been deleted
      if (remove) {
        logInfo('deleting unused VHD', { path: vhd })
        unusedVhdsDeletion.push(VhdAbstract.unlink(handler, vhd))
      }
    }

    toCheck.forEach(vhd => {
      vhdChainsToMerge[vhd] = getUsedChildChainOrDelete(vhd)
    })

    // merge interrupted VHDs
    for (const parent of interruptedVhds.keys()) {
      // before #6349 the chain wasn't in the mergeState
      const { chain, statePath } = interruptedVhds.get(parent)
      if (chain === undefined) {
        vhdChainsToMerge[parent] = [parent, vhdChildren[parent]]
      } else {
        vhdChainsToMerge[parent] = chain.map(vhdPath => handlerPath.resolveFromFile(statePath, vhdPath))
      }
    }

    Object.values(vhdChainsToMerge).forEach(chain => {
      if (chain !== undefined) {
        toMerge.push(chain)
      }
    })
  }

  const metadataWithMergedVhd = {}
  const doMerge = async () => {
    await asyncMap(toMerge, async chain => {
      const { finalVhdSize } = await limitedMergeVhdChain(handler, chain, {
        logInfo,
        logWarn,
        remove,
        mergeBlockConcurrency,
      })
      const metadataPath = vhdsToJSons[chain[chain.length - 1]] // all the chain should have the same metadata file
      metadataWithMergedVhd[metadataPath] = (metadataWithMergedVhd[metadataPath] ?? 0) + finalVhdSize
    })
  }

  await Promise.all([
    ...unusedVhdsDeletion,
    toMerge.length !== 0 && (merge ? Task.run({ name: 'merge' }, doMerge) : () => Promise.resolve()),
    asyncMap(unusedXvas, path => {
      logWarn('unused XVA', { path })
      if (remove) {
        logInfo('deleting unused XVA', { path })
        return handler.unlink(path)
      }
    }),
    asyncMap(xvaSums, path => {
      // no need to handle checksums for XVAs deleted by the script, they will be handled by `unlink()`
      if (!xvas.has(path.slice(0, -'.checksum'.length))) {
        logInfo('unused XVA checksum', { path })
        if (remove) {
          logInfo('deleting unused XVA checksum', { path })
          return handler.unlink(path)
        }
      }
    }),
  ])

  // update size for delta metadata with merged VHD
  // check for the other that the size is the same as the real file size
  await asyncMap(jsons, async metadataPath => {
    const metadata = backups.get(metadataPath)

    let fileSystemSize
    const mergedSize = metadataWithMergedVhd[metadataPath]

    const { mode, size, vhds, xva } = metadata

    try {
      if (mode === 'full') {
        // a full backup : check size
        const linkedXva = resolve('/', vmDir, xva)
        try {
          fileSystemSize = await handler.getSize(linkedXva)
          if (fileSystemSize !== size && fileSystemSize !== undefined) {
            logWarn('cleanVm: incorrect backup size in metadata', {
              path: metadataPath,
              actual: size ?? 'none',
              expected: fileSystemSize,
            })
          }
        } catch (error) {
          // can fail with encrypted remote
        }
      } else if (mode === 'delta') {
        // don't warn if the size has changed after a merge
        if (mergedSize === undefined) {
          const linkedVhds = Object.keys(vhds).map(key => resolve('/', vmDir, vhds[key]))
          fileSystemSize = await computeVhdsSize(handler, linkedVhds)
          // the size is not computed in some cases (e.g. VhdDirectory)
          if (fileSystemSize !== undefined && fileSystemSize !== size) {
            logWarn('cleanVm: incorrect backup size in metadata', {
              path: metadataPath,
              actual: size ?? 'none',
              expected: fileSystemSize,
            })
          }
        }
      }
    } catch (error) {
      logWarn('failed to get backup size', { backup: metadataPath, error })
      return
    }

    // systematically update size and differentials after a merge

    // @todo : after 2024-04-01 remove the fixmetadata options since the size computation is fixed
    if (mergedSize || (fixMetadata && fileSystemSize !== size)) {
      metadata.size = mergedSize ?? fileSystemSize ?? size

      if (mergedSize) {
        // all disks are now key disk
        metadata.isVhdDifferencing = {}
        for (const id of Object.keys(metadata.vdis ?? {})) {
          metadata.isVhdDifferencing[id] = false
        }
      }
      mustRegenerateCache = true
      try {
        await handler.writeFile(metadataPath, JSON.stringify(metadata), { flags: 'w' })
      } catch (error) {
        logWarn('failed to update backup size in metadata', { path: metadataPath, error })
      }
    }
  })

  if (mustRegenerateCache) {
    const cache = {}
    for (const [path, content] of backups.entries()) {
      cache[path] = {
        _filename: path,
        id: path,
        ...content,
      }
    }
    await this._writeCache(cachePath, cache)
  }

  return {
    // boolean whether some VHDs were merged (or should be merged)
    merge: toMerge.length !== 0,
  }
}
