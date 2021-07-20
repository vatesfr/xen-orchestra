const assert = require('assert')
const sum = require('lodash/sum')
const { asyncMap } = require('@xen-orchestra/async-map')
const { default: Vhd, mergeVhd } = require('vhd-lib')
const { dirname, resolve } = require('path')
const { DISK_TYPE_DIFFERENCING } = require('vhd-lib/dist/_constants.js')
const { isMetadataFile, isVhdFile, isXvaFile, isXvaSumFile } = require('./_backupType.js')
const { limitConcurrency } = require('limit-concurrency-decorator')

// chain is an array of VHDs from child to parent
//
// the whole chain will be merged into parent, parent will be renamed to child
// and all the others will deleted
const mergeVhdChain = limitConcurrency(1)(async function mergeVhdChain(chain, { handler, onLog, remove, merge }) {
  assert(chain.length >= 2)

  let child = chain[0]
  const parent = chain[chain.length - 1]
  const children = chain.slice(0, -1).reverse()

  chain
    .slice(1)
    .reverse()
    .forEach(parent => {
      onLog(`the parent ${parent} of the child ${child} is unused`)
    })

  if (merge) {
    // `mergeVhd` does not work with a stream, either
    // - make it accept a stream
    // - or create synthetic VHD which is not a stream
    if (children.length !== 1) {
      // TODO: implement merging multiple children
      children.length = 1
      child = children[0]
    }

    onLog(`merging ${child} into ${parent}`)

    let done, total
    const handle = setInterval(() => {
      if (done !== undefined) {
        onLog(`merging ${child}: ${done}/${total}`)
      }
    }, 10e3)

    await mergeVhd(
      handler,
      parent,
      handler,
      child,
      // children.length === 1
      //   ? child
      //   : await createSyntheticStream(handler, children),
      {
        onProgress({ done: d, total: t }) {
          done = d
          total = t
        },
      }
    )

    clearInterval(handle)

    await Promise.all([
      handler.rename(parent, child),
      asyncMap(children.slice(0, -1), child => {
        onLog(`the VHD ${child} is unused`)
        if (remove) {
          onLog(`deleting unused VHD ${child}`)
          return handler.unlink(child)
        }
      }),
    ])
  }
})

const noop = Function.prototype

const INTERRUPTED_VHDS_REG = /^(?:(.+)\/)?\.(.+)\.merge.json$/
const listVhds = async (handler, vmDir) => {
  const vhds = []
  const interruptedVhds = new Set()

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
            prependDir: true,
          })

          list.forEach(file => {
            const res = INTERRUPTED_VHDS_REG.exec(file)
            if (res === null) {
              vhds.push(file)
            } else {
              const [, dir, file] = res
              interruptedVhds.add(`${dir}/${file}`)
            }
          })
        }
      )
  )

  return { vhds, interruptedVhds }
}

exports.cleanVm = async function cleanVm(vmDir, { fixMetadata, remove, merge, onLog = noop }) {
  const handler = this._handler

  const vhds = new Set()
  const vhdParents = { __proto__: null }
  const vhdChildren = { __proto__: null }

  const vhdsList = await listVhds(handler, vmDir)

  // remove broken VHDs
  await asyncMap(vhdsList.vhds, async path => {
    try {
      const vhd = new Vhd(handler, path)
      await vhd.readHeaderAndFooter(!vhdsList.interruptedVhds.has(path))
      vhds.add(path)
      if (vhd.footer.diskType === DISK_TYPE_DIFFERENCING) {
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
    } catch (error) {
      onLog(`error while checking the VHD with path ${path}`, { error })
      if (error?.code === 'ERR_ASSERTION' && remove) {
        onLog(`deleting broken ${path}`)
        await handler.unlink(path)
      }
    }
  })

  // remove VHDs with missing ancestors
  {
    const deletions = []

    // return true if the VHD has been deleted or is missing
    const deleteIfOrphan = vhd => {
      const parent = vhdParents[vhd]
      if (parent === undefined) {
        return
      }

      // no longer needs to be checked
      delete vhdParents[vhd]

      deleteIfOrphan(parent)

      if (!vhds.has(parent)) {
        vhds.delete(vhd)

        onLog(`the parent ${parent} of the VHD ${vhd} is missing`)
        if (remove) {
          onLog(`deleting orphan VHD ${vhd}`)
          deletions.push(handler.unlink(vhd))
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

  const jsons = []
  const xvas = new Set()
  const xvaSums = []
  const entries = await handler.list(vmDir, {
    prependDir: true,
  })
  entries.forEach(path => {
    if (isMetadataFile(path)) {
      jsons.push(path)
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
    const metadata = JSON.parse(await handler.readFile(json))
    const { mode } = metadata
    let size
    if (mode === 'full') {
      const linkedXva = resolve('/', vmDir, metadata.xva)

      if (xvas.has(linkedXva)) {
        unusedXvas.delete(linkedXva)

        size = await handler.getSize(linkedXva).catch(error => {
          onLog(`failed to get size of ${json}`, { error })
        })
      } else {
        onLog(`the XVA linked to the metadata ${json} is missing`)
        if (remove) {
          onLog(`deleting incomplete backup ${json}`)
          await handler.unlink(json)
        }
      }
    } else if (mode === 'delta') {
      const linkedVhds = (() => {
        const { vhds } = metadata
        return Object.keys(vhds).map(key => resolve('/', vmDir, vhds[key]))
      })()

      // FIXME: find better approach by keeping as much of the backup as
      // possible (existing disks) even if one disk is missing
      if (linkedVhds.every(_ => vhds.has(_))) {
        linkedVhds.forEach(_ => unusedVhds.delete(_))

        size = await asyncMap(linkedVhds, vhd => handler.getSize(vhd)).then(sum, error => {
          onLog(`failed to get size of ${json}`, { error })
        })
      } else {
        onLog(`Some VHDs linked to the metadata ${json} are missing`)
        if (remove) {
          onLog(`deleting incomplete backup ${json}`)
          await handler.unlink(json)
        }
      }
    }

    const metadataSize = metadata.size
    if (size !== undefined && metadataSize !== size) {
      onLog(`incorrect size in metadata: ${metadataSize ?? 'none'} instead of ${size}`)

      // don't update if the the stored size is greater than found files,
      // it can indicates a problem
      if (fixMetadata && (metadataSize === undefined || metadataSize < size)) {
        try {
          metadata.size = size
          await handler.writeFile(json, JSON.stringify(metadata), { flags: 'w' })
        } catch (error) {
          onLog(`failed to update size in backup metadata ${json}`, { error })
        }
      }
    }
  })

  // TODO: parallelize by vm/job/vdi
  const unusedVhdsDeletion = []
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
        unusedVhdsDeletion.push(handler.unlink(vhd))
      }
    }

    toCheck.forEach(vhd => {
      vhdChainsToMerge[vhd] = getUsedChildChainOrDelete(vhd)
    })

    // merge interrupted VHDs
    if (merge) {
      vhdsList.interruptedVhds.forEach(parent => {
        vhdChainsToMerge[parent] = [vhdChildren[parent], parent]
      })
    }

    Object.keys(vhdChainsToMerge).forEach(key => {
      const chain = vhdChainsToMerge[key]
      if (chain !== undefined) {
        unusedVhdsDeletion.push(mergeVhdChain(chain, { handler, onLog, remove, merge }))
      }
    })
  }

  await Promise.all([
    ...unusedVhdsDeletion,
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
}
