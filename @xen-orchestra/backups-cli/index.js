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

const { basename, resolve } = require('path')
const { curryRight, flatten } = require('lodash')
const { pipe, promisifyAll } = require('promise-toolbox')
const { DISK_TYPE_DIFFERENCING } = require('vhd-lib/dist/_constants')
const Vhd = require('vhd-lib').default

const fs = promisifyAll(require('fs'))
const handler = require('@xen-orchestra/fs').getHandler({ url: 'file://' })

// -----------------------------------------------------------------------------

const asyncMap = curryRight((iterable, fn) =>
  Promise.all(
    Array.isArray(iterable) ? iterable.map(fn) : Array.from(iterable, fn)
  )
)

const fpify = method => (...args) =>
  function(thisArg) {
    return method.apply(thisArg, args)
  }

const filter = fpify([].filter)
const endsWith = fpify(''.endsWith)

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

const listVhds = pipe([
  vmDir => vmDir + '/vdis',
  readDir,
  asyncMap(readDir),
  flatten,
  asyncMap(readDir),
  flatten,
  filter(endsWith('.vhd')),
])

async function handleVm(vmDir) {
  const vhds = new Set()
  const vhdParents = { __proto__: null }

  // remove broken VHDs
  await asyncMap(await listVhds(vmDir), async path => {
    try {
      const vhd = new Vhd(handler, path)
      await vhd.readHeaderAndFooter()
      vhds.add(path)
      if (vhd.footer.diskType === DISK_TYPE_DIFFERENCING) {
        vhdParents[path] = resolve(basename(path), vhd.header.parentUnicodeName)
      }
    } catch (error) {
      console.warn('Error while checking VHD', path)
      console.warn('  ', error)
      if (error != null && error.code === 'ERR_ASSERTION') {
        console.warn('  deleting…')
        console.warn('')
        force && (await fs.unlink(path))
      }
    }
  })

  // remove VHDs with missing ancestors
  {
    const deletions = []

    const check = (parent, child) => {
      // no longer needs to be checked
      delete vhdParents[child]

      // check the ancestors first
      const grandparent = vhdParents[parent]
      if (grandparent !== undefined) {
        check(grandparent, parent)
      }

      if (!vhds.has(parent)) {
        vhds.delete(child)

        console.warn('Error while checking VHD', child)
        console.warn('  missing parent', parent)
        console.warn('  deleting…')
        console.warn('')
        force && deletions.push(fs.unlink(child))
      }
    }

    // > A property that is deleted before it has been visited will not be
    // > visited later.
    // >
    // > -- https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/for...in#Deleted_added_or_modified_properties
    for (const child in vhdParents) {
      check(vhdParents[child], child)
    }

    await Promise.all(deletions)
  }

  const [jsons, xvas] = await readDir(vmDir).then(entries => [
    entries.filter(endsWith('.json')),
    entries.filter(endsWith('.xva')),
  ])

  const unusedVhds = new Set(vhds)
  const unusedXvas = new Set(xvas)

  await asyncMap(jsons, async json => {
    const metadata = JSON.parse(await fs.readFile(json))
    const { mode } = metadata
    if (mode === 'full') {
      const linkedXva = resolve(vmDir, metadata.xva)

      if (xvas.has(linkedXva)) {
        unusedXvas.delete(resolve(vmDir, linkedXva))
      } else {
        console.warn('Error while checking backup', json)
        console.warn('  missing file', linkedXva)
        console.warn('  deleting…')
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
        console.warn('  deleting…')
        console.warn('')
        force && (await fs.unlink(json))
      }
    }
  })

  await Promise.all([
    asyncMap(unusedXvas, path => {
      console.warn('Unused XVA', path)
      console.warn('  deleting…')
      console.warn('')
      return force && fs.unlink(path)
    }),
  ])

  // TODO: merge>/remove unused VHDs
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
