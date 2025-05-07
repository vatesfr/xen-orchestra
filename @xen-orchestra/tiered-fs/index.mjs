import assert from 'node:assert'

const CAPACITY = 1
const PERFORMANCE = 2
export const STORAGE_CLASSES = {
  CAPACITY,
  PERFORMANCE,
}

const CAPACITY_SUFFIX = '.capacity'

const DEFAULT_STORAGE_CLASSES = [
  {
    regex: /^xo-vm-backups\/.*\/.*\.json$/,
    classes: CAPACITY | PERFORMANCE,
  },
  {
    regex: /xo-vm-backups\/.*\/.*\.xva$/,
    classes: CAPACITY,
  },
  {
    regex: /xo-vm-backups\/.*\/.*\.xva\.checksum$/,
    classes: CAPACITY | PERFORMANCE,
  },
  {
    regex: /\xo-vm-backups\/.*\/vdis\/.*\/.*\/.*\.alias.vhd$/,
    classes: CAPACITY | PERFORMANCE,
  },
  {
    regex: /\xo-vm-backups\/.*\/vdis\/.*\/.*\/data\/blocks\/[0-9]{3}\/[0-9]{3}/,
    classes: CAPACITY,
  },
  {
    regex: /^xo-config-backups/,
    classes: CAPACITY | PERFORMANCE,
  },
  {
    regex: /^xo-pool-metadata-backups/,
    classes: CAPACITY | PERFORMANCE,
  },
]
// it does not extends RemoteHandlerAbstract since we don't want to stack limits and magic
export class TieredFs {
  #performance
  #capacity
  #storageClasses

  constructor(performanceRemoteHandler, capacityRemoteHandler, storageClasses = DEFAULT_STORAGE_CLASSES) {
    this.#performance = performanceRemoteHandler
    this.#capacity = capacityRemoteHandler
    this.#storageClasses = storageClasses
  }
  #computeStorageClass(path) {
    for (const { regex, classes } in Object.keys(this.#storageClasses)) {
      if (regex.test(path)) {
        return classes
      }
    }
    return PERFORMANCE
  }

  async #getCapacityMetadata(path) {
    const content = await this.#performance.readFile(`${path}${CAPACITY_SUFFIX}`)
    return JSON.parse(content)
  }

  #writeCapacityPlaceHolder(path, capacityMetadata) {
    return this.performanceRemoteHandler.writeFile(`${path}${CAPACITY_SUFFIX}`, JSON.stringify(capacityMetadata))
  }

  #methodWithPathsAsFirst(method, args, numberofPaths = 1) {
    let storageClass
    for (let i = 0; i < numberofPaths; i++) {
      const pathStorageClass = this.#computeStorageClass(args[i])
      if (i > 0) {
        assert.strictEqual(pathStorageClass, storageClass)
      }
      storageClass = pathStorageClass
    }

    const promises = []
    if (storageClass & PERFORMANCE) {
      promises.push(this.#performance[method].apply(this.#performance, args))
    }
    if (storageClass & CAPACITY) {
      promises.push(this.#capacity[method].apply(this.#capacity, args))
      const performanceArgs = [...args]
      for (let i = 0; i < numberofPaths; i++) {
        performanceArgs[i] = [`${performanceArgs[i]}${CAPACITY_SUFFIX}`]
      }
      promises.push(this.#performance[method].apply(this.#performance, performanceArgs))
    }
    return Promise.all(promises)
  }

  copy() {
    return this.#methodWithPathsAsFirst('copy', arguments, 2)
  }

  outputStream(path) {
    const storageClass = this.#computeStorageClass(path)
    const promises = []
    if (storageClass & PERFORMANCE) {
      promises.push(this.#performance.outputStream.apply(this.#performance, arguments))
    }
    if (storageClass & CAPACITY) {
      promises.push(
        this.#capacity.outputStream.apply(this.#capacity, arguments).then(metadata => {
          return this.#writeCapacityPlaceHolder(path, metadata)
        })
      )
    }
    return Promise.all(promises)
  }

  async writeFile(path) {
    const storageClass = this.#computeStorageClass(path)
    const promises = []
    if (storageClass & PERFORMANCE) {
      promises.push(this.#performance.writeFile.apply(this.#performance, arguments))
    }
    if (storageClass & CAPACITY) {
      promises.push(
        this.#capacity.writeFile.apply(this.#capacity, arguments).then(metadata => {
          return this.#writeCapacityPlaceHolder(path, metadata)
        })
      )
    }
    return Promise.all(promises)
  }

  async createReadStream(path, options) {
    const storageClass = this.#computeStorageClass(path)
    if (storageClass & STORAGE_CLASSES.PERFORMANCE) {
      return this.#performance.createReadStream(path, options)
    }
    const { key } = await this.#getCapacityMetadata(path)
    return this.#capacity.createReadStream(key, options)
  }

  unlink() {
    return this.#methodWithPathsAsFirst('unlink', arguments)
  }

  // list is always done on performance
  async list(dir, opts) {
    const list = await this.#performance.list(dir, opts)
    const uniq = new Set()
    list.forEach(path => {
      if (path.endsWith(CAPACITY_SUFFIX)) {
        uniq.add(path.substr(0, path.length - CAPACITY_SUFFIX.length))
      } else {
        uniq.add(path)
      }
    })
    return [...uniq]
  }

  mkdir(path, opts) {
    // capacity handler don't use dir
    return this.#performance.mkdir(path, opts)
  }

  rename() {
    return this.#methodWithPathsAsFirst('copy', arguments, 2)
  }

  async getSize(file) {
    const storageClass = this.#computeStorageClass(file)
    if (storageClass & STORAGE_CLASSES.PERFORMANCE) {
      return this.#performance.getSize(file)
    }
    const { size } = await this.#getCapacityMetadata(file)
    return size
  }

  read() {
    return this.#methodWithPathsAsFirst('read', arguments)
  }

  rmdir(path, opts) {
    // capacity handler don't use dir
    return this.#performance.rmdir(path, opts)
  }

  openFile(path) {
    // not really supported
    return path
  }

  _closeFile(fd) {
    // not really supported
  }

  _sync() {
    return Promise.all([
        this.#performance.sync(),
        this.#capacity.sync()
    ])
  }

  useVhdDirectory() {
    return true
  }
}
