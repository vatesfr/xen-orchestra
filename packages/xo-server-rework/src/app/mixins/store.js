// import generateId from 'cuid'
// import mkdirp from 'simple-mkdirp'
// import { pCatch, pTap } from 'promise-toolbox'
// import { join } from 'path'
// import { readFile, writeFile } from '@xen-orchestra/async-fs'

// TODO: transition from in-memory database to a real database system.
export default class Store {
  // constructor (app, { config: { datadir } }) {
  //   this._get = () => {
  //     const datafile = join(datadir, 'store.json')
  //
  //     const promise = readFile(datafile)
  //       .then(JSON.parse)
  //       .catch(pCatch({ code: 'ENOENT' }, () => ({})))
  //       .then(pTap(data => {
  //         app.on('stop', data =>
  //           mkdirp(datadir)
  //             .then(() => writeFile(datafile, JSON.stringify(data)))
  //         )
  //       }))
  //
  //     // Inline future accesses.
  //     this._get = () => promise
  //
  //     return promise
  //   }
  //
  //   this._types = {}
  // }
  //
  // registerType (name, spec) {
  //   const types = this._types
  //
  //   if (__DEV__ && name in types) {
  //     throw new Error(`type ${name} is already registered`)
  //   }
  //
  //   types[name] = spec
  // }
  //
  // async createObject ({ type, ...props }) {
  //   if (__DEV__ && !type) {
  //     throw new Error('missing type')
  //   }
  //
  //   const db = await this._get()
  //   const byType = db.byType || (db.byType = {})
  //   const collection = byType[type] || (byType[type] = {})
  //
  //   let { id } = props
  //   if (!id) {
  //     props.id = id = generateId()
  //   }
  //
  //   collection[id] = props
  // }
}
