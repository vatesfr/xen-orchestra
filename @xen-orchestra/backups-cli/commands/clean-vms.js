#!/usr/bin/env node

// assigned when options are parsed by the main function
let force

// -----------------------------------------------------------------------------

const assert = require('assert')
const flatten = require('lodash/flatten')
const getopts = require('getopts')
const lockfile = require('proper-lockfile')
const pipe = require('promise-toolbox/pipe')
const { default: Vhd } = require('vhd-lib')
const { dirname, resolve } = require('path')
const { DISK_TYPE_DIFFERENCING } = require('vhd-lib/dist/_constants')

const asyncMap = require('../_asyncMap')
const fs = require('../_fs')

const handler = require('@xen-orchestra/fs').getHandler({ url: 'file://' })

// -----------------------------------------------------------------------------

const isGzipFile = async fd => {
  // https://tools.ietf.org/html/rfc1952.html#page-5
  const magicNumber = Buffer.allocUnsafe(2)
  assert.strictEqual(
    await fs.read(fd, magicNumber, 0, magicNumber.length, 0),
    magicNumber.length
  )
  return magicNumber[0] === 31 && magicNumber[1] === 139
}

// TODO: better check?
//
// our heuristic is not good enough, there has been some false positives
// (detected as invalid by us but valid by `tar` and imported with success),
// either THOUGH THEY MAY HAVE BEEN COMPRESSED FILES:
// - these files were normal but the check is incorrect
// - these files were invalid but without data loss
// - these files were invalid but with silent data loss
//
// maybe reading the end of the file looking for a file named
// /^Ref:\d+/\d+\.checksum$/ and then validating the tar structure from it
//
// https://github.com/npm/node-tar/issues/234#issuecomment-538190295
const isValidTar = async (size, fd) => {
  if (size <= 1024 || size % 512 !== 0) {
    return false
  }

  const buf = Buffer.allocUnsafe(1024)
  assert.strictEqual(
    await fs.read(fd, buf, 0, buf.length, size - buf.length),
    buf.length
  )
  return buf.every(_ => _ === 0)
}

// TODO: find an heuristic for compressed files
const isValidXva = async path => {
  try {
    const fd = await fs.open(path, 'r')
    try {
      const { size } = await fs.fstat(fd)
      if (size < 20) {
        // neither a valid gzip not tar
        return false
      }

      return (await isGzipFile(fd))
        ? true // gzip files cannot be validated at this time
        : await isValidTar(size, fd)
    } finally {
      fs.close(fd).catch(noop)
    }
  } catch (error) {
    // never throw, log and report as valid to avoid side effects
    console.error('isValidXva', path, error)
    return true
  }
}

const noop = Function.prototype

// -----------------------------------------------------------------------------

// chain is an array of VHDs from child to parent
//
// the whole chain will be merged into parent, parent will be renamed to child
// and all the others will deleted
async function mergeVhdChain(chain) {
  assert(chain.length >= 2)

  const child = chain[0]
  const parent = chain[chain.length - 1]
  const children = chain.slice(0, -1).reverse()

  console.warn('Unused parents of VHD', child)
  chain
    .slice(1)
    .reverse()
    .forEach(parent => {
      console.warn('  ', parent)
    })
  force && console.warn('  merging…')
  console.warn('')
  if (force) {
    // `mergeVhd` does not work with a stream, either
    // - make it accept a stream
    // - or create synthetic VHD which is not a stream
    return console.warn('TODO: implement merge')
    // await mergeVhd(
    //   handler,
    //   parent,
    //   handler,
    //   children.length === 1
    //     ? child
    //     : await createSyntheticStream(handler, children)
    // )
  }

  await Promise.all([
    force && fs.rename(parent, child),
    asyncMap(children.slice(0, -1), child => {
      console.warn('Unused VHD', child)
      force && console.warn('  deleting…')
      console.warn('')
      return force && handler.unlink(child)
    }),
  ])
}

const listVhds = pipe([
  vmDir => vmDir + '/vdis',
  fs.readdir2,
  asyncMap(fs.readdir2),
  flatten,
  asyncMap(fs.readdir2),
  flatten,
  _ => _.filter(_ => _.endsWith('.vhd')),
])

async function handleVm(vmDir) {
  const vhds = new Set()
  const vhdParents = { __proto__: null }
  const vhdChildren = { __proto__: null }

  // remove broken VHDs
  await asyncMap(await listVhds(vmDir), async path => {
    try {
      const vhd = new Vhd(handler, path)
      await vhd.readHeaderAndFooter()
      vhds.add(path)
      if (vhd.footer.diskType === DISK_TYPE_DIFFERENCING) {
        const parent = resolve(dirname(path), vhd.header.parentUnicodeName)
        vhdParents[path] = parent
        if (parent in vhdChildren) {
          const error = new Error(
            'this script does not support multiple VHD children'
          )
          error.parent = parent
          error.child1 = vhdChildren[parent]
          error.child2 = path
          throw error // should we throw?
        }
        vhdChildren[parent] = path
      }
    } catch (error) {
      console.warn('Error while checking VHD', path)
      console.warn('  ', error)
      if (error != null && error.code === 'ERR_ASSERTION') {
        force && console.warn('  deleting…')
        console.warn('')
        force && (await handler.unlink(path))
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

        console.warn('Error while checking VHD', vhd)
        console.warn('  missing parent', parent)
        force && console.warn('  deleting…')
        console.warn('')
        force && deletions.push(handler.unlink(vhd))
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

  const [jsons, xvas] = await fs
    .readdir2(vmDir)
    .then(entries => [
      entries.filter(_ => _.endsWith('.json')),
      new Set(entries.filter(_ => _.endsWith('.xva'))),
    ])

  await asyncMap(xvas, async path => {
    // check is not good enough to delete the file, the best we can do is report
    // it
    if (!(await isValidXva(path))) {
      console.warn('Potential broken XVA', path)
      console.warn('')
    }
  })

  const unusedVhds = new Set(vhds)
  const unusedXvas = new Set(xvas)

  // compile the list of unused XVAs and VHDs, and remove backup metadata which
  // reference a missing XVA/VHD
  await asyncMap(jsons, async json => {
    const metadata = JSON.parse(await fs.readFile(json))
    const { mode } = metadata
    if (mode === 'full') {
      const linkedXva = resolve(vmDir, metadata.xva)

      if (xvas.has(linkedXva)) {
        unusedXvas.delete(linkedXva)
      } else {
        console.warn('Error while checking backup', json)
        console.warn('  missing file', linkedXva)
        force && console.warn('  deleting…')
        console.warn('')
        force && (await handler.unlink(json))
      }
    } else if (mode === 'delta') {
      const linkedVhds = (() => {
        const { vhds } = metadata
        return Object.keys(vhds).map(key => resolve(vmDir, vhds[key]))
      })()

      // FIXME: find better approach by keeping as much of the backup as
      // possible (existing disks) even if one disk is missing
      if (linkedVhds.every(_ => vhds.has(_))) {
        linkedVhds.forEach(_ => unusedVhds.delete(_))
      } else {
        console.warn('Error while checking backup', json)
        const missingVhds = linkedVhds.filter(_ => !vhds.has(_))
        console.warn(
          '  %i/%i missing VHDs',
          missingVhds.length,
          linkedVhds.length
        )
        missingVhds.forEach(vhd => {
          console.warn('  ', vhd)
        })
        force && console.warn('  deleting…')
        console.warn('')
        force && (await handler.unlink(json))
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

      console.warn('Unused VHD', vhd)
      force && console.warn('  deleting…')
      console.warn('')
      force && unusedVhdsDeletion.push(handler.unlink(vhd))
    }

    toCheck.forEach(vhd => {
      vhdChainsToMerge[vhd] = getUsedChildChainOrDelete(vhd)
    })

    Object.keys(vhdChainsToMerge).forEach(key => {
      const chain = vhdChainsToMerge[key]
      if (chain !== undefined) {
        unusedVhdsDeletion.push(mergeVhdChain(chain))
      }
    })
  }

  await Promise.all([
    unusedVhdsDeletion,
    asyncMap(unusedXvas, path => {
      console.warn('Unused XVA', path)
      force && console.warn('  deleting…')
      console.warn('')
      return force && handler.unlink(path)
    }),
  ])
}

// -----------------------------------------------------------------------------

module.exports = async function main(args) {
  const opts = getopts(args, {
    alias: {
      force: 'f',
    },
    boolean: ['force'],
    default: {
      force: false,
    },
  })

  ;({ force } = opts)
  await asyncMap(opts._, async vmDir => {
    vmDir = resolve(vmDir)

    // TODO: implement this in `xo-server`, not easy because not compatible with
    // `@xen-orchestra/fs`.
    const release = await lockfile.lock(vmDir)
    try {
      await handleVm(vmDir)
    } catch (error) {
      console.error('handleVm', vmDir, error)
    } finally {
      await release()
    }
  })
}
