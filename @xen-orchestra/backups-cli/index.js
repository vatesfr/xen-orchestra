#!/usr/bin/env node

const args = process.argv.slice(2)

if (
  args.length === 0 ||
  /^(?:-h|--help)$/.test(args[0]) ||
  args[0] !== 'clean-vms'
) {
  console.log('Usage: xo-backups clean-vms [--force] xo-vm-backups/*')
  // eslint-disable-next-line no-process-exit
  return process.exit(1)
}

// remove `clean-vms` arg which is the only available command ATM
args.splice(0, 1)

// only act (ie delete files) if `--force` is present
const force = args[0] === '--force'
if (force) {
  args.splice(0, 1)
}

// -----------------------------------------------------------------------------

const assert = require('assert')
const { createSyntheticStream, default: Vhd, mergeVhd } = require('vhd-lib')
const { curryRight, flatten } = require('lodash')
const { dirname, resolve } = require('path')
const { DISK_TYPE_DIFFERENCING } = require('vhd-lib/dist/_constants')
const { pipe, promisifyAll } = require('promise-toolbox')

const fs = promisifyAll(require('fs'))
const handler = require('@xen-orchestra/fs').getHandler({ url: 'file://' })

// -----------------------------------------------------------------------------

const asyncMap = curryRight((iterable, fn) =>
  Promise.all(
    Array.isArray(iterable) ? iterable.map(fn) : Array.from(iterable, fn)
  )
)

const filter = (...args) => thisArg => thisArg.filter(...args)

const readDir = path =>
  fs.readdir(path).then(
    entries => {
      entries.forEach((entry, i) => {
        entries[i] = `${path}/${entry}`
      })

      return entries
    },
    () => []
  )

// -----------------------------------------------------------------------------

// chain is an array of VHD from child to ancestor
//
// the whole chain will be merged into child and all ancestors deleted
async function mergeVhdChain(chain) {
  assert(chain.length >= 2)

  const child = chain[0]
  const ancestors = chain.slice(1).reverse()

  console.warn('Unused ancestors of VHD', child)
  ancestors.forEach(ancestor => {
    console.warn('  ')
  })
  force && console.warn('  merging…')
  console.warn('')
  if (force) {
    const parent =
      ancestors.length === 1
        ? ancestors[0]
        : await createSyntheticStream(handler, ancestors)

    await mergeVhd(handler, parent, handler, child)
  }

  await asyncMap(ancestors, ancestor => {
    console.warn('Unused VHD', ancestor)
    force && console.warn('  deleting…')
    console.warn('')
    return force && fs.unlink(ancestor)
  })
}

const listVhds = pipe([
  vmDir => vmDir + '/vdis',
  readDir,
  asyncMap(readDir),
  flatten,
  asyncMap(readDir),
  flatten,
  filter(_ => _.endsWith('.vhd')),
])

// TODO: add lock on VM dir
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
        force && (await fs.unlink(path))
      }
    }
  })

  // remove VHDs with missing ancestors
  {
    const deletions = []

    const deleteIfOrphan = (parent, child) => {
      // no longer needs to be checked
      delete vhdParents[child]

      // check the ancestors first
      const grandparent = vhdParents[parent]
      if (grandparent !== undefined) {
        deleteIfOrphan(grandparent, parent)
      }

      if (!vhds.has(parent)) {
        vhds.delete(child)

        console.warn('Error while checking VHD', child)
        console.warn('  missing parent', parent)
        force && console.warn('  deleting…')
        console.warn('')
        force && deletions.push(fs.unlink(child))
      }
    }

    // > A property that is deleted before it has been visited will not be
    // > visited later.
    // >
    // > -- https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/for...in#Deleted_added_or_modified_properties
    for (const child in vhdParents) {
      deleteIfOrphan(vhdParents[child], child)
    }

    await Promise.all(deletions)
  }

  const [jsons, xvas] = await readDir(vmDir).then(entries => [
    entries.filter(_ => _.endsWith('.json')),
    entries.filter(_ => _.endsWith('.xva')),
  ])

  // TODO: find a fast way to check XVAs validity
  //
  // maybe reading the end of the file looking for a file named
  // /^Ref:\d+/\d+\.checksum$/ and then validating the tar structure from it

  const unusedVhds = new Set(vhds)
  const unusedXvas = new Set(xvas)

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
        force && (await fs.unlink(json))
      }
    } else if (mode === 'delta') {
      let linkedVhds = metadata.vhds
      linkedVhds = Object.keys(linkedVhds).map(key =>
        resolve(vmDir, linkedVhds[key])
      )

      if (linkedVhds.every(_ => vhds.has(_))) {
        linkedVhds.forEach(_ => unusedVhds.delete(_))
      } else {
        console.warn('Error while checking backup', json)
        linkedVhds
          .filter(_ => !vhds.has(_))
          .forEach(linkedVhd => {
            console.warn('  missing file', linkedVhd)
          })
        force && console.warn('  deleting…')
        console.warn('')
        force && (await fs.unlink(json))
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

    const deleteIfChildless = vhd => {
      console.log('deleteIfChildless', vhd)
      const chain = vhdChainsToMerge[vhd]
      if (chain !== undefined) {
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
        const chain = deleteIfChildless(child)
        if (chain !== undefined) {
          chain.push(vhd)
          return chain
        }
      }

      const parent = vhdParents[vhd]
      if (parent !== undefined) {
        delete vhdChildren[parent]
      }
      console.warn('Unused VHD', vhd)
      force && console.warn('  deleting…')
      console.warn('')
      force && unusedVhdsDeletion.push(fs.unlink(vhd))
    }

    toCheck.forEach(vhd => {
      const chain = deleteIfChildless(vhd)
      if (chain !== undefined) {
        vhdChainsToMerge[vhd] = chain
      }
    })

    Object.keys(vhdChainsToMerge).forEach(key => {
      unusedVhdsDeletion.push(mergeVhdChain(vhdChainsToMerge[key]))
    })
  }

  await Promise.all([
    unusedVhdsDeletion,
    asyncMap(unusedXvas, path => {
      console.warn('Unused XVA', path)
      force && console.warn('  deleting…')
      console.warn('')
      return force && fs.unlink(path)
    }),
  ])

  // TODO: merge/remove unused VHDs
  // if (unusedVhds.size !== 0) {
  //   console.log({ unusedVhds });
  // }
}

// -----------------------------------------------------------------------------

asyncMap(args, vmDir =>
  handleVm(resolve(vmDir)).catch(error =>
    console.error('handleVm', vmDir, error)
  )
).catch(error => console.error('main', error))
