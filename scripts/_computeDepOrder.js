'use strict'

function addPkgDepsToTree(deps, internalDeps) {
  if (deps !== undefined) {
    for (const depName of Object.keys(deps)) {
      const dep = this.pkgs[depName]
      if (dep !== undefined) {
        internalDeps.push(depName)
        addPkgToTree.call(this, dep)
      }
    }
  }
}

function addPkgToTree(pkg) {
  const { name, package: pkgJson } = pkg

  if (!(name in this.tree)) {
    const internalDeps = (this.tree[name] = [])

    addPkgDepsToTree.call(this, pkgJson.dependencies, internalDeps)
    addPkgDepsToTree.call(this, pkgJson.devDependencies, internalDeps)
    addPkgDepsToTree.call(this, pkgJson.optionalDependencies, internalDeps)
    addPkgDepsToTree.call(this, pkgJson.peerDependencies, internalDeps)
  }
}

function addPkgToResolution(name) {
  if (!this.resolution.has(name)) {
    this.tree[name].sort().forEach(addPkgToResolution, this)
    this.resolution.add(name)
  }
}

/**
 * @returns {string[]} package names in the order they should be released
 */
module.exports = function computeDepOrder(pkgsByName) {
  const tree = { __proto__: null }
  Object.values(pkgsByName).forEach(addPkgToTree, { pkgs: pkgsByName, tree })

  const resolution = new Set()
  Object.keys(tree).sort().forEach(addPkgToResolution, { resolution, tree })
  return Array.from(resolution)
}
