'use strict'

const assert = require('assert')
const sum = require('lodash/sum')
const { asyncMap } = require('@xen-orchestra/async-map')
const { Constants, mergeVhd, openVhd, VhdAbstract, VhdFile } = require('vhd-lib')
const { isVhdAlias, resolveVhdAlias } = require('vhd-lib/aliases')
const { dirname, resolve } = require('path')
const { DISK_TYPES } = Constants
const { isMetadataFile, isVhdFile, isXvaFile, isXvaSumFile } = require('./_backupType.js')
const { limitConcurrency } = require('limit-concurrency-decorator')

const { Task } = require('./Task.js')
const { Disposable } = require('promise-toolbox')

// checking the size of a vhd directory is costly
// 1 Http Query per 1000 blocks
// we only check size of all the vhd are VhdFiles
function shouldComputeVhdsSize(vhds) {
  return vhds.every(vhd => vhd instanceof VhdFile)
}

const computeVhdsSize = (handler, vhdPaths) =>
  Disposable.use(
    vhdPaths.map(vhdPath => openVhd(handler, vhdPath)),
    async vhds => {
      if (shouldComputeVhdsSize(vhds)) {
        const sizes = await asyncMap(vhds, vhd => vhd.getSize())
        return sum(sizes)
      }
    }
  )

// chain is an array of VHDs from child to parent
//
// the whole chain will be merged into parent, parent will be renamed to child
// and all the others will deleted
async function mergeVhdChain(chain, { handler, onLog, remove, merge }) {
  assert(chain.length >= 2)
  const chainCopy = [...chain]
  const parent = chainCopy.pop()
  const children = chainCopy.reverse()

  if (merge) {
    onLog(`merging ${children.length} children into ${parent}`)

    let done, total
    const handle = setInterval(() => {
      if (done !== undefined) {
        onLog(`merging ${children.join(',')} into ${parent}: ${done}/${total}`)
      }
    }, 10e3)

    const mergedSize = await mergeVhd(handler, parent, handler, children, {
      onProgress({ done: d, total: t }) {
        done = d
        total = t
      },
    })

    clearInterval(handle)
    const mergeTargetChild = children.pop()
    await Promise.all([
      VhdAbstract.rename(handler, parent, mergeTargetChild),
      asyncMap(children, child => {
        onLog(`the VHD ${child} is already merged`)
        if (remove) {
          onLog(`deleting merged VHD ${child}`)
          return VhdAbstract.unlink(handler, child)
        }
      }),
    ])

    return mergedSize
  }
}

const noop = Function.prototype

const INTERRUPTED_VHDS_REG = /^\.(.+)\.merge.json$/
const listVhds = async (handler, vmDir) => {
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
          list.forEach(file => {
            const res = INTERRUPTED_VHDS_REG.exec(file)
            if (res === null) {
              vhds.add(`${vdiDir}/${file}`)
            } else {
              interruptedVhds.set(`${vdiDir}/${res[1]}`, `${vdiDir}/${file}`)
            }
          })
        }
      )
  )

  return { vhds, interruptedVhds, aliases }
}

async function checkAliases(aliasPaths, targetDataRepository, { handler, onLog = noop, remove = false }) {
  const aliasFound = []
  for (const path of aliasPaths) {
    const target = await resolveVhdAlias(handler, path)

    if (!isVhdFile(target)) {
      onLog(`Alias ${path} references a non vhd target:  ${target}`)
      if (remove) {
        await handler.unlink(target)
        await handler.unlink(path)
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
      onLog(`target ${target} of alias ${path} is missing or broken`, { error })
      if (remove) {
        try {
          await VhdAbstract.unlink(handler, path)
        } catch (e) {
          if (e.code !== 'ENOENT') {
            onLog(`Error while deleting target ${target} of alias ${path}`, { error: e })
          }
        }
      }
      continue
    }

    aliasFound.push(resolve('/', target))
  }

  const entries = await handler.list(targetDataRepository, {
    ignoreMissing: true,
    prependDir: true,
  })

  entries.forEach(async entry => {
    if (!aliasFound.includes(entry)) {
      onLog(`the Vhd  ${entry} is not referenced by a an alias`)
      if (remove) {
        await VhdAbstract.unlink(handler, entry)
      }
    }
  })
}
exports.checkAliases = checkAliases

const defaultMergeLimiter = limitConcurrency(1)

exports.cleanVm = async function cleanVm(
  vmDir,
  { fixMetadata, remove, merge, mergeLimiter = defaultMergeLimiter, onLog = noop }
) {
  const limitedMergeVhdChain = mergeLimiter(mergeVhdChain)

  const handler = this._handler

  const vhdsToJSons = new Set()
  const vhdParents = { __proto__: null }
  const vhdChildren = { __proto__: null }

  const { vhds, interruptedVhds, aliases } = await listVhds(handler, vmDir)

  // remove broken VHDs
  await asyncMap(vhds, async path => {
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
      })
    } catch (error) {
      vhds.delete(path)
      onLog(`error while checking the VHD with path ${path}`, { error })
      if (error?.code === 'ERR_ASSERTION' && remove) {
        onLog(`deleting broken ${path}`)
        return VhdAbstract.unlink(handler, path)
      }
    }
  })

  // remove interrupted merge states for missing VHDs
  for (const interruptedVhd of interruptedVhds.keys()) {
    if (!vhds.has(interruptedVhd)) {
      const statePath = interruptedVhds.get(interruptedVhd)
      interruptedVhds.delete(interruptedVhd)

      onLog('orphan merge state', {
        mergeStatePath: statePath,
        missingVhdPath: interruptedVhd,
      })
      if (remove) {
        onLog(`deleting orphan merge state ${statePath}`)
        await handler.unlink(statePath)
      }
    }
  }

  // check if alias are correct
  // check if all vhd in data subfolder have a corresponding alias
  await asyncMap(Object.keys(aliases), async dir => {
    await checkAliases(aliases[dir], `${dir}/data`, { handler, onLog, remove })
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

        onLog(`the parent ${parent} of the VHD ${vhdPath} is missing`)
        if (remove) {
          onLog(`deleting orphan VHD ${vhdPath}`)
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

  await asyncMap(xvas, async path => {
    // check is not good enough to delete the file, the best we can do is report
    // it
    if (!(await this.isValidXva(path))) {
      onLog(`the XVA with path ${path} is potentially broken`)
    }
  })

  const unusedVhds = new Set(vhds)
  const unusedXvas = new Set(xvas)

  // compile the list of unused XVAs and VHDs, and remove backup metadata which
  // reference a missing XVA/VHD
  await asyncMap(jsons, async json => {
    let metadata
    try {
      metadata = JSON.parse(await handler.readFile(json))
    } catch (error) {
      onLog(`failed to read metadata file ${json}`, { error })
      jsons.delete(json)
      return
    }

    const { mode } = metadata
    if (mode === 'full') {
      const linkedXva = resolve('/', vmDir, metadata.xva)
      if (xvas.has(linkedXva)) {
        unusedXvas.delete(linkedXva)
      } else {
        onLog(`the XVA linked to the metadata ${json} is missing`)
        if (remove) {
          onLog(`deleting incomplete backup ${json}`)
          jsons.delete(json)
          await handler.unlink(json)
        }
      }
    } else if (mode === 'delta') {
      const linkedVhds = (() => {
        const { vhds } = metadata
        return Object.keys(vhds).map(key => resolve('/', vmDir, vhds[key]))
      })()

      const missingVhds = linkedVhds.filter(_ => !vhds.has(_))

      // FIXME: find better approach by keeping as much of the backup as
      // possible (existing disks) even if one disk is missing
      if (missingVhds.length === 0) {
        linkedVhds.forEach(_ => unusedVhds.delete(_))
        linkedVhds.forEach(path => {
          vhdsToJSons[path] = json
        })
      } else {
        onLog(`Some VHDs linked to the metadata ${json} are missing`, { missingVhds })
        if (remove) {
          onLog(`deleting incomplete backup ${json}`)
          jsons.delete(json)
          await handler.unlink(json)
        }
      }
    }
  })

  // TODO: parallelize by vm/job/vdi
  const unusedVhdsDeletion = []
  const toMerge = []
  {
    // VHD chains (as list from child to ancestor) to merge indexed by last
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
          chain.push(vhd)
          return chain
        }
      }

      onLog(`the VHD ${vhd} is unused`)
      if (remove) {
        onLog(`deleting unused VHD ${vhd}`)
        unusedVhdsDeletion.push(VhdAbstract.unlink(handler, vhd))
      }
    }

    toCheck.forEach(vhd => {
      vhdChainsToMerge[vhd] = getUsedChildChainOrDelete(vhd)
    })

    // merge interrupted VHDs
    for (const parent of interruptedVhds.keys()) {
      vhdChainsToMerge[parent] = [vhdChildren[parent], parent]
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
      const merged = await limitedMergeVhdChain(chain, { handler, onLog, remove, merge })
      if (merged !== undefined) {
        const metadataPath = vhdsToJSons[chain[0]] // all the chain should have the same metada file
        metadataWithMergedVhd[metadataPath] = true
      }
    })
  }

  await Promise.all([
    ...unusedVhdsDeletion,
    toMerge.length !== 0 && (merge ? Task.run({ name: 'merge' }, doMerge) : doMerge()),
    asyncMap(unusedXvas, path => {
      onLog(`the XVA ${path} is unused`)
      if (remove) {
        onLog(`deleting unused XVA ${path}`)
        return handler.unlink(path)
      }
    }),
    asyncMap(xvaSums, path => {
      // no need to handle checksums for XVAs deleted by the script, they will be handled by `unlink()`
      if (!xvas.has(path.slice(0, -'.checksum'.length))) {
        onLog(`the XVA checksum ${path} is unused`)
        if (remove) {
          onLog(`deleting unused XVA checksum ${path}`)
          return handler.unlink(path)
        }
      }
    }),
  ])

  // update size for delta metadata with merged VHD
  // check for the other that the size is the same as the real file size

  await asyncMap(jsons, async metadataPath => {
    const metadata = JSON.parse(await handler.readFile(metadataPath))

    let fileSystemSize
    const merged = metadataWithMergedVhd[metadataPath] !== undefined

    const { mode, size, vhds, xva } = metadata

    try {
      if (mode === 'full') {
        // a full backup : check size
        const linkedXva = resolve('/', vmDir, xva)
        fileSystemSize = await handler.getSize(linkedXva)
      } else if (mode === 'delta') {
        const linkedVhds = Object.keys(vhds).map(key => resolve('/', vmDir, vhds[key]))
        fileSystemSize = await computeVhdsSize(handler, linkedVhds)

        // the size is not computed in some cases (e.g. VhdDirectory)
        if (fileSystemSize === undefined) {
          return
        }

        // don't warn if the size has changed after a merge
        if (!merged && fileSystemSize !== size) {
          onLog(`incorrect size in metadata: ${size ?? 'none'} instead of ${fileSystemSize}`)
        }
      }
    } catch (error) {
      onLog(`failed to get size of ${metadataPath}`, { error })
      return
    }

    // systematically update size after a merge
    if ((merged || fixMetadata) && size !== fileSystemSize) {
      metadata.size = fileSystemSize
      try {
        await handler.writeFile(metadataPath, JSON.stringify(metadata), { flags: 'w' })
      } catch (error) {
        onLog(`failed to update size in backup metadata ${metadataPath} after merge`, { error })
      }
    }
  })

  return {
    // boolean whether some VHDs were merged (or should be merged)
    merge: toMerge.length !== 0,
  }
}
