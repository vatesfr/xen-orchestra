// schema.js
import {
  GraphQLObjectType,
  GraphQLString,
  GraphQLID,
  GraphQLList,
  GraphQLNonNull,
  GraphQLInt,
  GraphQLBoolean,
} from 'graphql'
import { PubSub } from 'graphql-subscriptions'
import * as CM from 'complex-matcher'
import { every } from '@vates/predicates'
import { ifDef } from '@xen-orchestra/defined'

const pubsub = new PubSub()

const handleOptionalUserFilter = filter => filter && CM.parse(filter).createPredicate()
export default class XapiGraphQlSchema {
  #app
  #query
  #types
  get query() {
    return this.#query
  }
  get subscription() {
    return new GraphQLObjectType({
      name: 'RootSubscriptionType',
      fields: {
        vmUpdated: {
          type: this.#types.VM,
          args: { uuid: { type: new GraphQLNonNull(GraphQLID) } },
          subscribe: (parent, { uuid }) => pubsub.asyncIterator(`VM_UPDATED_${uuid}`),
          resolve: payload => payload,
        },
      },
    })
  }
  constructor(app) {
    this.#app = app
    this.#makeTypes()
    this.#makeQueries()
  }
  #resolveXapiObject(id) {
    return { ...this.#app.getObject(id), timestamp: Math.round(Date.now() / 1000) }
  }

  #resolveXapiObjects(xapiType, { filter, limit, offset } = {}) {
    return Object.values(
      this.#app.getObjects({
        filter: every(_ => _.type === xapiType, handleOptionalUserFilter(filter)),
        limit: ifDef(limit, Number),
        offset: ifDef(offset, Number),
      })
    ).map(o => ({ ...o, timestamp: Math.round(Date.now() / 1000) }))
  }

  #makeTypes() {
    this.#types = {}
    const self = this

    const standardCollectionArgs = {
      limit: { type: GraphQLInt },
      offset: { type: GraphQLInt },
      filter: { type: GraphQLString },
    }

    this.#types.host = new GraphQLObjectType({
      name: 'host',
      fields: () => ({
        uuid: { type: GraphQLID },
        name_label: { type: GraphQLString },
        description: { type: GraphQLString },
        timestamp: { type: GraphQLInt },
        vms: {
          type: GraphQLList(self.#types.VM),
          args: standardCollectionArgs,
          resolve(parent, args) {
            return self.#resolveXapiObjects('VM', args).filter(vm => vm.$container === parent.uuid)
          },
        },
      }),
    })

    this.#types.VM = new GraphQLObjectType({
      name: 'VM',
      fields: () => ({
        uuid: { type: GraphQLID },
        name_label: { type: GraphQLString },
        description: { type: GraphQLString },
        power_state: { type: GraphQLString },
        timestamp: { type: GraphQLInt },
        host: {
          type: self.#types.host,
          args: {
            filter: { type: GraphQLString },
          },
          resolve(parent, args) {
            return self.#resolveXapiObject(parent.$container)
          },
        },
        vbds: {
          type: GraphQLList(self.#types.VBD),
          args: standardCollectionArgs,
          resolve(parent, args) {
            return self.#resolveXapiObjects('VBD', args).filter(vbd => vbd.VM === parent.uuid)
          },
        },
      }),
    })

    this.#types.VBD = new GraphQLObjectType({
      name: 'VBD',
      fields: () => ({
        attached: { type: GraphQLBoolean },
        bootable: { type: GraphQLBoolean },
        is_cd_drive: { type: GraphQLBoolean },
        read_only: { type: GraphQLBoolean },
        device: { type: GraphQLString },
        position: { type: GraphQLString },
        timestamp: { type: GraphQLInt },
        vm: {
          type: self.#types.VM,
          args: {
            filter: { type: GraphQLString },
          },
          resolve(parent, args) {
            return self.#resolveXapiObject(parent.VM)
          },
        },
        vdi: {
          type: self.#types.VDI,
          args: {
            filter: { type: GraphQLString },
          },
          resolve(parent, args) {
            return self.#resolveXapiObject(parent.VDI)
          },
        },
      }),
    })

    this.#types.VDI = new GraphQLObjectType({
      name: 'VDI',
      fields: () => ({
        uuid: { type: GraphQLID },
        name_label: { type: GraphQLString },
        description: { type: GraphQLString },
        size: { type: GraphQLInt },
        usage: { type: GraphQLInt },
        timestamp: { type: GraphQLInt },

        vbds: {
          type: GraphQLList(self.#types.VBD),
          args: standardCollectionArgs,
          resolve(parent, args) {
            return self.#resolveXapiObjects('VBD', args).filter(vbd => vbd.VDI === parent.uuid)
          },
        },
        sr: {
          type: self.#types.SR,
          args: {
            filter: { type: GraphQLString },
          },
          resolve(parent, args) {
            return self.#resolveXapiObject(parent?.$SR)
          },
        },
      }),
    })
    this.#types.SR = new GraphQLObjectType({
      name: 'SR',
      fields: () => ({
        uuid: { type: GraphQLID },
        name_label: { type: GraphQLString },
        description: { type: GraphQLString },
        size: { type: GraphQLInt },
        usage: { type: GraphQLInt },
        timestamp: { type: GraphQLInt },

        vdis: {
          type: GraphQLList(self.#types.VDI),
          args: standardCollectionArgs,
          resolve(parent, args) {
            return self.#resolveXapiObjects('VDI', args).filter(vdi => vdi.SR === parent.uuid)
          },
        },
      }),
    })
  }

  #makeQueries() {
    const self = this
    const fields = {}
    Object.entries(this.#types).forEach(([typeName, type]) => {
      fields[typeName] = {
        type,
        args: {
          id: { type: GraphQLID },
        },
        resolve(parent, args) {
          return self.#resolveXapiObject(args.id)
        },
      }
      fields[typeName + 's'] = {
        type: new GraphQLList(type),
        args: {
          limit: { type: GraphQLInt },
          offset: { type: GraphQLInt },
          filter: { type: GraphQLString },
        },
        resolve(parent, args) {
          return self.#resolveXapiObjects(typeName, args)
        },
      }
    })
    this.#query = new GraphQLObjectType({
      name: 'XoQueryType',
      fields,
    })
  }
}
